"use client";

import { useRef, useState, type ComponentPropsWithRef, type ReactElement, type ReactNode } from "react";
import * as Primitive from "@radix-ui/react-tooltip";
import { useStudioTheme } from "./studio-theme";
import styles from "./tooltip.module.css";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <Primitive.Provider delayDuration={450} skipDelayDuration={200}>{children}</Primitive.Provider>;
}

/** As-child composition preserves the shell's native button/link layout and refs. */
export function Tooltip({ children, content, side = "bottom" }: {
  children: ReactElement;
  content?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const theme = useStudioTheme();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement>();
  if (!content) return children;
  return <Primitive.Root open={open} onOpenChange={(next) => {
    // Native popovers/dialogs live above body portals. Keep their tooltips in the same top layer.
    if (next) setContainer(trigger.current?.closest<HTMLElement>("[popover],dialog") ?? undefined);
    setOpen(next);
  }}>
    <Primitive.Trigger asChild ref={trigger}>{children}</Primitive.Trigger>
    <Primitive.Portal container={container}>
      <Primitive.Content className={styles.content} data-studio-theme={theme ?? "dark"} side={side} sideOffset={8} collisionPadding={12} sticky="always" hideWhenDetached onEscapeKeyDown={(event) => event.stopPropagation()}>
        {content}<Primitive.Arrow className={styles.arrow} width={10} height={5} />
      </Primitive.Content>
    </Primitive.Portal>
  </Primitive.Root>;
}

type TooltipProps = { tooltip?: string };
export function StudioButton({ tooltip, title, type = "button", ...props }: ComponentPropsWithRef<"button"> & TooltipProps) {
  return <Tooltip content={tooltip ?? title ?? props["aria-label"]}><button {...props} type={type} /></Tooltip>;
}
export function StudioLink({ tooltip, title, ...props }: ComponentPropsWithRef<"a"> & TooltipProps) {
  return <Tooltip content={tooltip ?? title ?? props["aria-label"]}><a {...props} /></Tooltip>;
}
