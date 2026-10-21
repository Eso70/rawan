"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { StudioButton } from "../../components/ui/tooltip";
import styles from "./book-ribbon.module.css";

export const ribbonTabs = [
  "Home",
  "Insert",
  "Design",
  "Layout",
  "View",
  "Help",
] as const;
export type RibbonTab = (typeof ribbonTabs)[number];

export function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.group} aria-label={label}>
      <div className={styles.tools}>{children}</div>
      <span className={styles.groupLabel}>{label}</span>
    </section>
  );
}
export function RibbonRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
export function BookRibbon({
  panels,
}: {
  panels: Record<RibbonTab, ReactNode>;
}) {
  const [tab, setTab] = useState<RibbonTab>("Home");
  const [collapsed, setCollapsed] = useState(false);
  const tabs = useRef<HTMLDivElement>(null);
  const id = useId();
  return (
    <div className={styles.ribbon}>
      <div className={styles.tabBar}>
        <div
          ref={tabs}
          role="tablist"
          aria-label="Writing ribbon"
          className={styles.tabs}
        >
          {ribbonTabs.map((name, index) => (
            <StudioButton
              key={name}
              role="tab"
              id={`${id}-${name}`}
              aria-selected={tab === name}
              aria-controls={`${id}-panel`}
              tabIndex={tab === name ? 0 : -1}
              onClick={() => {
                setTab(name);
                setCollapsed(false);
              }}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? ribbonTabs.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          ribbonTabs.length) %
                        ribbonTabs.length;
                setTab(ribbonTabs[next]);
                tabs.current
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                  [next]?.focus();
              }}
            >
              {name}
            </StudioButton>
          ))}
        </div>
        <StudioButton
          className={styles.collapse}
          aria-label={collapsed ? "Expand ribbon" : "Collapse ribbon"}
          aria-expanded={!collapsed}
          aria-controls={`${id}-panel`}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <IconChevronDown size={15} />
          ) : (
            <IconChevronUp size={15} />
          )}
        </StudioButton>
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab}`}
        className={styles.panel}
        hidden={collapsed}
        tabIndex={0}
      >
        {panels[tab]}
      </div>
    </div>
  );
}
