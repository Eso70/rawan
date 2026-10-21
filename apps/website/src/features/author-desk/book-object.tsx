"use client";

import { StudioButton } from "../../components/ui/tooltip";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { IconRotateClockwise, IconMinus, IconPlus } from "@tabler/icons-react";
import type { BookCovers, CoverSide } from "./book-preview";
import type { BookCoverStyle } from "./book-cover-style";
import styles from "./book-object.module.css";

type Props = { title: string; subtitle: string; covers: BookCovers; style: BookCoverStyle; view: CoverSide; viewRequest: number };
function lines(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number) {
  ctx.font = `500 ${size}px "Rawan Lora", Georgia, serif`;
  const words = text.split(/\s+/); const result: string[] = []; let line = "";
  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (line) { result.push(line); line = ""; }
      for (const char of word) { if (ctx.measureText(line + char).width > maxWidth) { result.push(line); line = char; } else line += char; }
    } else if (ctx.measureText(line ? line + " " + word : word).width > maxWidth && line) { result.push(line); line = word; } else line += (line ? " " : "") + word;
  }
  if (line) result.push(line);
  result.slice(0,5).forEach((item,index) => ctx.fillText(item, x, y + index * size * 1.3));
  return Math.min(result.length,5) * size * 1.3;
}
function coverCanvas(title: string, subtitle: string, style: BookCoverStyle, side: CoverSide) {
  const canvas = document.createElement("canvas"); canvas.width = side === "spine" ? 160 : 768; canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = style.color; ctx.fillRect(0,0,canvas.width,1080);
  if (style.finish === "linen") {
    ctx.strokeStyle = "#ffffff0b"; ctx.lineWidth = 1;
    for (let i=0;i<1080;i+=4) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }
    ctx.strokeStyle = "#0000000a";
    for (let i=0;i<canvas.width;i+=4) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1080); ctx.stroke(); }
  }
  ctx.fillStyle = "#fff6df"; ctx.strokeStyle = "#e3cd9c"; ctx.lineWidth = 3;
  if (side === "spine") {
    ctx.save(); ctx.translate(80,540); ctx.rotate(Math.PI/2); ctx.textAlign="center"; ctx.font='500 36px Georgia'; ctx.fillText(title,0,0,850); ctx.restore(); return canvas;
  }
  if (side === "back") {
    ctx.strokeRect(60,60,648,960); ctx.textAlign="center"; lines(ctx,title,384,420,560,46);
    ctx.beginPath(); ctx.arc(384,800,30,0,Math.PI*2); ctx.stroke(); return canvas;
  }
  if (style.layout === "arch") {
    ctx.beginPath(); ctx.moveTo(100,980); ctx.lineTo(100,350); ctx.bezierCurveTo(100,45,668,45,668,350); ctx.lineTo(668,980); ctx.stroke();
    ctx.beginPath(); ctx.arc(384,275,40,0,Math.PI*2); ctx.stroke(); ctx.textAlign="center";
    const height=lines(ctx,title,384,470,510,64); if (subtitle) lines(ctx,subtitle,384,490+height,480,27);
    ctx.fillRect(350,915,68,3);
  } else if (style.layout === "editorial") {
    ctx.fillStyle="#f0dfbd"; ctx.fillRect(0,780,768,300); ctx.fillStyle="#fff6df"; ctx.textAlign="left";
    const height=lines(ctx,title,65,170,630,76); if (subtitle) lines(ctx,subtitle,65,205+height,610,29);
    ctx.fillStyle=style.color; ctx.font='500 100px Georgia'; ctx.fillText("R",620,990);
    ctx.fillRect(65,855,170,3);
  } else {
    ctx.save(); ctx.translate(384,380); ctx.rotate(-.45);
    [140,195,250].forEach((radius) => { ctx.beginPath(); ctx.ellipse(0,0,radius,radius*.65,0,0,Math.PI*2); ctx.stroke(); }); ctx.restore();
    ctx.fillStyle="#f0dfbd"; ctx.beginPath(); ctx.arc(384,380,26,0,Math.PI*2); ctx.fill();
    ctx.textAlign="center"; const height=lines(ctx,title,384,750,620,61); if(subtitle) lines(ctx,subtitle,384,775+height,580,27);
  }
  return canvas;
}

export function BookObject(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ camera: THREE.PerspectiveCamera; controls: OrbitControls; render: () => void; target: THREE.Vector3 | null } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const latest = useRef(props); latest.current = props;
  const rebuild = useRef<(() => void) | null>(null);
  useEffect(() => {
    const element = host.current; if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setUnavailable(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.5;
    const canvas=renderer.domElement; canvas.tabIndex=0; canvas.setAttribute("role","img"); canvas.setAttribute("aria-label","Interactive 3D book. Drag to rotate, pinch to zoom. Arrow keys rotate; plus and minus zoom; Home resets.");
    element.append(canvas);
    const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(36,1,.1,100); camera.position.set(-2.8,1.3,6.6);
    const controls=new OrbitControls(camera,canvas); controls.enablePan=false; controls.enableDamping=true; controls.dampingFactor=.09; controls.minDistance=4; controls.maxDistance=10; controls.minPolarAngle=.3; controls.maxPolarAngle=Math.PI-.3; controls.zoomSpeed=.7; controls.rotateSpeed=.7;
    scene.add(new THREE.HemisphereLight("#fff5dc","#647a95",2.6));
    const key=new THREE.DirectionalLight("#fff1d2",4); key.position.set(-3,5,5); scene.add(key);
    const rim=new THREE.DirectionalLight("#bdd7ff",2.2); rim.position.set(4,2,-3); scene.add(rim);
    const group=new THREE.Group(); scene.add(group);
    let disposed=false; let frame=0; let materials: THREE.Material[]=[]; let textures: THREE.Texture[]=[]; let geometries: THREE.BufferGeometry[]=[];
    const render=() => { if (!frame && !disposed) frame=requestAnimationFrame(draw); };
    const draw=() => { frame=0; const state=runtime.current; let moving=false; if(state?.target) { camera.position.lerp(state.target,.13); moving=camera.position.distanceTo(state.target)>.005; if(!moving) { camera.position.copy(state.target); state.target=null; } } const changed=controls.update(); renderer.render(scene,camera); if(moving||changed) render(); };
    runtime.current={camera,controls,render,target:null}; controls.addEventListener("change",render); controls.addEventListener("start",()=>{if(runtime.current) runtime.current.target=null;});
    const resize=new ResizeObserver(()=>{ const width=element.clientWidth,height=element.clientHeight; if(!width||!height)return; renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); render(); }); resize.observe(element);
    let generation=0;
    rebuild.current=() => {
      const current=++generation; const {title,subtitle,covers,style}=latest.current;
      group.clear(); materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose()); geometries.forEach(g=>g.dispose()); materials=[]; textures=[]; geometries=[];
      const material=(options: THREE.MeshStandardMaterialParameters) => { const mat=new THREE.MeshStandardMaterial(options); materials.push(mat); return mat; };
      const mesh=(width:number,height:number,depth:number,mat:THREE.Material|THREE.Material[],radius=.025) => {const geometry=new RoundedBoxGeometry(width,height,depth,3,radius); geometries.push(geometry); const object=new THREE.Mesh(geometry,mat);group.add(object);return object;};
      const tex=(side:CoverSide) => { const texture=new THREE.CanvasTexture(coverCanvas(title,subtitle,style,side));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.push(texture);
        if(covers[side]) {const image=new window.Image(); image.onload=()=>{if(disposed||current!==generation)return;const target=document.createElement("canvas");target.width=side==="spine"?160:768;target.height=1080;const ctx=target.getContext("2d")!;const scale=Math.max(target.width/image.width,target.height/image.height);ctx.drawImage(image,(target.width-image.width*scale)/2,(target.height-image.height*scale)/2,image.width*scale,image.height*scale);texture.image=target;texture.needsUpdate=true;render();};image.src=covers[side]!;} return texture;};
      const depth=style.thickness;
      const paper=document.createElement("canvas");paper.width=64;paper.height=512; const pc=paper.getContext("2d")!;pc.fillStyle="#e9dfc8";pc.fillRect(0,0,64,512);pc.fillStyle="#baad933d";for(let y=0;y<512;y+=4)pc.fillRect(0,y,64,1);
      const paperTex=new THREE.CanvasTexture(paper); textures.push(paperTex); const paperMat=material({map:paperTex,roughness:.95});
      const edge=material({color:style.color,roughness:.8}); mesh(1.94,2.88,depth,paperMat,.015).position.x=.02;
      const front=material({map:tex("front"),roughness:style.finish==="linen"?.86:.55});
      const back=material({map:tex("back"),roughness:.8});
      mesh(2.06,3.02,.045,[edge,edge,edge,edge,front,edge]).position.z=depth/2+.018;
      mesh(2.06,3.02,.045,[edge,edge,edge,edge,edge,back]).position.z=-depth/2-.018;
      const spine=material({map:tex("spine"),roughness:.8});mesh(.075,3.02,depth+.075,[edge,spine,edge,edge,edge,edge],.025).position.x=-1.015;
      render();
    };
    rebuild.current();
    void document.fonts.load('500 32px "Rawan Lora"').then(()=>{if(!disposed)rebuild.current?.();});
    const keyboard=(event:KeyboardEvent)=>{ const spherical=new THREE.Spherical().setFromVector3(camera.position);if(event.key==="ArrowLeft")spherical.theta-=.18;else if(event.key==="ArrowRight")spherical.theta+=.18;else if(event.key==="ArrowUp")spherical.phi=Math.max(.3,spherical.phi-.12);else if(event.key==="ArrowDown")spherical.phi=Math.min(Math.PI-.3,spherical.phi+.12);else if(event.key==="+")spherical.radius=Math.max(4,spherical.radius-.5);else if(event.key==="-")spherical.radius=Math.min(10,spherical.radius+.5);else if(event.key==="Home"){camera.position.set(-2.8,1.3,6.6);controls.update();render();event.preventDefault();return;}else return;event.preventDefault();camera.position.setFromSpherical(spherical);controls.update();render();};
    canvas.addEventListener("keydown",keyboard);
    const lost=(event:Event)=>{event.preventDefault();setUnavailable(true);};canvas.addEventListener("webglcontextlost",lost);
    return()=>{disposed=true;generation++;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();canvas.removeEventListener("keydown",keyboard);canvas.removeEventListener("webglcontextlost",lost);materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();canvas.remove();runtime.current=null;rebuild.current=null;};
  },[]);
  useEffect(()=>{rebuild.current?.();},[props.title,props.subtitle,props.covers,props.style]);
  useEffect(()=>{const state=runtime.current;if(!state)return;const distance=state.camera.position.length();const direction=props.view==="back"?new THREE.Vector3(1.5,.6,-6.6):props.view==="spine"?new THREE.Vector3(-6.7,.6,.3):new THREE.Vector3(-2.8,1.3,6.6);state.target=direction.normalize().multiplyScalar(distance);if(matchMedia("(prefers-reduced-motion: reduce)").matches){state.camera.position.copy(state.target);state.target=null;state.controls.update();}state.render();},[props.view,props.viewRequest]);
  const zoom=(scale:number)=>{const state=runtime.current;if(!state)return;state.target=null;state.camera.position.setLength(THREE.MathUtils.clamp(state.camera.position.length()*scale,4,10));state.controls.update();state.render();};
  return <div className={styles.objectStage}>
    <div ref={host} className={styles.canvasHost} />
    {unavailable && <div className={styles.fallback}><div style={{background:props.style.color}}>{props.covers[props.view]?<img src={props.covers[props.view]!} alt={props.view+" cover"}/>:<strong>{props.title}</strong>}</div><p>3D is unavailable in this browser. Your artwork can still be edited.</p></div>}
    <p className={styles.hint}>Drag to turn · Pinch or scroll to zoom</p>
    <div className={styles.viewTools}><StudioButton type="button" aria-label="Zoom out" onClick={()=>zoom(1.15)}><IconMinus size={15}/></StudioButton><StudioButton type="button" aria-label="Reset book view" onClick={()=>{const state=runtime.current;if(state){state.camera.position.set(-2.8,1.3,6.6);state.target=null;state.controls.update();state.render();}}}><IconRotateClockwise size={15}/></StudioButton><StudioButton type="button" aria-label="Zoom in" onClick={()=>zoom(.87)}><IconPlus size={15}/></StudioButton></div>
  </div>;
}
