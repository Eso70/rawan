"use client";
import { Children, useRef, useState, type ReactNode } from "react";
export function SplitView({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const panes = Children.toArray(children);
  const container = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(62);
  const clamp = (value: number) => Math.max(40, Math.min(75, value));
  return (
    <div
      ref={container}
      className={`s-resizable ${className}`}
      style={{
        gridTemplateColumns: `minmax(0,${ratio}fr) 12px minmax(0,${100 - ratio}fr)`,
      }}
    >
      {panes[0]}
      <div
        className="s-pane-separator"
        role="separator"
        aria-label="Resize workspace and detail panel"
        aria-orientation="vertical"
        aria-valuemin={40}
        aria-valuemax={75}
        aria-valuenow={ratio}
        tabIndex={0}
        onDoubleClick={() => setRatio(62)}
        onKeyDown={(e) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            setRatio(
              e.key === "Home"
                ? 40
                : e.key === "End"
                  ? 75
                  : clamp(ratio + (e.key === "ArrowRight" ? 2 : -2)),
            );
          }
        }}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const r = container.current?.getBoundingClientRect();
          if (r)
            setRatio(clamp(Math.round(((e.clientX - r.left) / r.width) * 100)));
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      />
      <div className="s-split-secondary">{panes[1]}</div>
    </div>
  );
}
