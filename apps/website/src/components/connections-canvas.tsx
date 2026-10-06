"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./connections-canvas.module.css";

export function ConnectionsCanvas({ className }: { className: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const camera = useRef({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{ pointer: number; x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const draw = useRef<() => void>(() => {});

  function zoomBy(factor: number, anchor?: { x: number; y: number }) {
    const element = canvas.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const state = camera.current;
    const next = Math.max(0.5, Math.min(4, state.zoom * factor));
    const ratio = next / state.zoom;
    const ax = (anchor?.x ?? rect.width / 2) - rect.width / 2;
    const ay = (anchor?.y ?? rect.height / 2) - rect.height / 2;
    state.x = ax - (ax - state.x) * ratio;
    state.y = ay - (ay - state.y) * ratio;
    state.zoom = next;
    draw.current();
  }

  function reset() {
    camera.current = { zoom: 1, x: 0, y: 0 };
    draw.current();
  }

  useEffect(() => {
    const element = canvas.current;
    const container = frame.current;
    if (!element || !container) return;
    const context = element.getContext("2d");
    if (!context) {
      setFailed(true);
      return;
    }
    let disposed = false;
    draw.current = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (element.width !== width || element.height !== height) {
        element.width = width;
        element.height = height;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = "#000";
      context.fillRect(0, 0, rect.width, rect.height);
      const art = image.current;
      if (!art?.complete || !art.naturalWidth) return;
      const fit = Math.min(
        rect.width / art.naturalWidth,
        rect.height / art.naturalHeight,
      );
      const widthDrawn = art.naturalWidth * fit * camera.current.zoom;
      const heightDrawn = art.naturalHeight * fit * camera.current.zoom;
      context.drawImage(
        art,
        (rect.width - widthDrawn) / 2 + camera.current.x,
        (rect.height - heightDrawn) / 2 + camera.current.y,
        widthDrawn,
        heightDrawn,
      );
    };
    const resize = () => {
      const rect = container.getBoundingClientRect();
      container.style.setProperty(
        "--control-right",
        `${Math.max(14, rect.right - window.innerWidth + 24)}px`,
      );
      draw.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadObserver.disconnect();
        const art = new Image();
        art.onload = () => {
          if (!disposed) {
            image.current = art;
            draw.current();
          }
        };
        art.onerror = () => {
          if (!disposed) setFailed(true);
        };
        art.src = "/images/toolkit/visual-connections.png";
      },
      { rootMargin: "200px" },
    );
    loadObserver.observe(container);
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = element.getBoundingClientRect();
      zoomBy(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.002), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    resize();
    return () => {
      disposed = true;
      observer.disconnect();
      loadObserver.disconnect();
      window.removeEventListener("resize", resize);
      element.removeEventListener("wheel", wheel);
      image.current = null;
      draw.current = () => {};
    };
  }, []);

  return (
    <div ref={frame} className={`${className} ${styles.graph}`}>
      <canvas
        ref={canvas}
        data-graph-canvas="true"
        role="img"
        aria-label="World relationships graph. Drag to pan. Control or Command plus wheel zooms. Use plus and minus to zoom, arrow keys to pan, and zero to reset."
        tabIndex={0}
        className={styles.canvas}
        onPointerDown={(event) => {
          if (event.button !== 0 || drag.current) return;
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.style.cursor = "grabbing";
        }}
        onPointerMove={(event) => {
          const previous = drag.current;
          if (!previous || previous.pointer !== event.pointerId) return;
          camera.current.x += event.clientX - previous.x;
          camera.current.y += event.clientY - previous.y;
          previous.x = event.clientX;
          previous.y = event.clientY;
          draw.current();
        }}
        onLostPointerCapture={(event) => {
          drag.current = null;
          event.currentTarget.style.cursor = "grab";
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={(event) => {
          const keys = [
            "+",
            "=",
            "-",
            "0",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
          ];
          if (!keys.includes(event.key)) return;
          event.preventDefault();
          if (event.key === "+" || event.key === "=") zoomBy(1.2);
          else if (event.key === "-") zoomBy(1 / 1.2);
          else if (event.key === "0") reset();
          else {
            camera.current.x +=
              event.key === "ArrowRight"
                ? 32
                : event.key === "ArrowLeft"
                  ? -32
                  : 0;
            camera.current.y +=
              event.key === "ArrowDown"
                ? 32
                : event.key === "ArrowUp"
                  ? -32
                  : 0;
            draw.current();
          }
        }}
      >
        World relationships graph preview.
      </canvas>
      <div
        className={styles.controls}
        role="group"
        aria-label="Relationship graph controls"
      >
        <button aria-label="Zoom in on connections" onClick={() => zoomBy(1.2)}>
          +
        </button>
        <button
          aria-label="Zoom out of connections"
          onClick={() => zoomBy(1 / 1.2)}
        >
          −
        </button>
        <button aria-label="Reset connections view" onClick={reset}>
          Reset
        </button>
      </div>
      {failed && (
        <p className={styles.error} role="status">
          The graph image could not load. Please refresh to try again.
        </p>
      )}
    </div>
  );
}
