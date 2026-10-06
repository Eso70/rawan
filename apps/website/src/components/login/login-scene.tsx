"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./login.module.css";
import { createLoginAmbient } from "./login-ambient";

/** Loaded only on desktop. The original GLB's textures and materials are retained. */
export function LoginScene() {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading artwork…");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const setup = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      element.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      camera.position.set(0, 0.15, 5.7);
      scene.add(new THREE.HemisphereLight(0xffead7, 0x64769d, 2.6));
      const key = new THREE.DirectionalLight(0xffeedc, 3.5);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xbbaaff, 2);
      rim.position.set(3, 2, -3);
      scene.add(rim);
      const pivot = new THREE.Group();
      scene.add(pivot);
      const ambient = createLoginAmbient(THREE);
      scene.add(ambient.group);
      let model: import("three").Object3D | undefined;
      const releaseModel = (object: import("three").Object3D) => {
        const materials = new Set<import("three").Material>();
        const textures = new Set<import("three").Texture>();
        const geometries = new Set<import("three").BufferGeometry>();
        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          geometries.add(child.geometry);
          const list = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const material of list) {
            materials.add(material);
            for (const value of Object.values(material)) {
              if (value instanceof THREE.Texture) textures.add(value);
            }
          }
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
      };
      const resize = () => {
        camera.aspect = element.clientWidth / Math.max(element.clientHeight, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(element.clientWidth, element.clientHeight);
        const height =
          2 *
          camera.position.z *
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        pivot.position.x = -height * camera.aspect * 0.225;
        ambient.resize(height * camera.aspect, height);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      resize();
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let pointerX = 0;
      let pointerY = 0;
      const pointer = (event: PointerEvent) => {
        pointerX = (event.clientX / innerWidth - 0.5) * 0.3;
        pointerY = (event.clientY / innerHeight - 0.5) * 0.1;
      };
      window.addEventListener("pointermove", pointer, { passive: true });
      let elapsed = 0;
      let previous = performance.now();
      renderer.setAnimationLoop((time) => {
        const delta = Math.min((time - previous) / 1000, 0.05);
        previous = time;
        if (document.hidden) return;
        if (!reduced.matches) elapsed += delta;
        pivot.rotation.y +=
          ((reduced.matches ? 0 : Math.sin(elapsed * 0.2) * 0.28 + pointerX) -
            pivot.rotation.y) *
          0.04;
        pivot.rotation.x +=
          ((reduced.matches ? 0 : pointerY) - pivot.rotation.x) * 0.04;
        pivot.position.y = reduced.matches ? 0 : Math.sin(elapsed * 0.4) * 0.05;
        ambient.animate(elapsed);
        renderer.render(scene, camera);
      });
      dispose = () => {
        observer.disconnect();
        window.removeEventListener("pointermove", pointer);
        renderer.setAnimationLoop(null);
        if (model) releaseModel(model);
        releaseModel(ambient.group);
        renderer.dispose();
        renderer.domElement.remove();
      };
      new GLTFLoader().load(
        "/models/login/dragonspire-library-monk.glb",
        (gltf) => {
          if (cancelled) {
            releaseModel(gltf.scene);
            return;
          }
          model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const scale = 3.7 / Math.max(size.y, size.x, size.z);
          model.scale.multiplyScalar(scale);
          model.position.copy(center).multiplyScalar(-scale);
          pivot.add(model);
          setStatus("");
        },
        undefined,
        () => {
          if (!cancelled) setStatus("Artwork unavailable");
        },
      );
    };
    void setup().catch(() => {
      if (!cancelled) setStatus("Artwork unavailable");
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div
      className={styles.scene}
      role="img"
      aria-label="Dragonspire Library Monk, a gently moving 3D sculpture"
    >
      <div ref={host} className={styles.canvasHost} />
      {status && (
        <span className={styles.loading} role="status">
          {status}
        </span>
      )}
    </div>
  );
}
