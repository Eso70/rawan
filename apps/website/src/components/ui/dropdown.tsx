"use client";

import { useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import styles from "./dropdown.module.css";
import { useStudioTheme } from "./studio-theme";
import { Tooltip } from "./tooltip";

export type DropdownOption = { value: string; label: string; prefix?: string; ariaLabel?: string; disabled?: boolean };

export function Dropdown({ id, label, labelledBy, triggerText, value, onValueChange, options, disabled, tooltip, variant = "field", onCloseAutoFocus }: {
  id?: string;
  label: string;
  labelledBy?: string;
  triggerText?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly DropdownOption[];
  disabled?: boolean;
  tooltip?: string;
  variant?: "field" | "compact" | "inline";
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const studioTheme = useStudioTheme();
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  useEffect(() => {
    // A dropdown inside a native dialog must remain in that dialog's top layer.
    setContainer(trigger.current?.closest("dialog") ?? undefined);
  }, []);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Tooltip content={studioTheme ? tooltip ?? label : undefined}>
      <Select.Trigger ref={trigger} id={id} aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} className={styles.trigger} data-variant={variant}>
        <Select.Value placeholder={triggerText}>{triggerText}</Select.Value><Select.Icon asChild><IconChevronDown size={variant === "inline" ? 10 : 14} stroke={1.6} /></Select.Icon>
      </Select.Trigger>
      </Tooltip>
      <Select.Portal container={container}>
        <Select.Content data-studio-theme={studioTheme} className={styles.content} data-variant={variant} position="popper" side={variant === "inline" ? "top" : "bottom"} align={variant === "inline" ? "end" : "start"} sideOffset={variant === "inline" ? 10 : 6} collisionPadding={10} onCloseAutoFocus={onCloseAutoFocus} onEscapeKeyDown={(event) => event.stopPropagation()}>
          <Select.ScrollUpButton className={styles.scroll}><IconChevronUp size={13} /></Select.ScrollUpButton>
          <Select.Viewport className={styles.viewport}>
            {options.map((option) => <Select.Item key={option.value} className={styles.item} value={option.value} disabled={option.disabled} aria-label={option.ariaLabel}>
              <Select.ItemText>{option.prefix && <span className={styles.prefix} aria-hidden="true">{option.prefix}</span>}{option.label}</Select.ItemText>
              <Select.ItemIndicator className={styles.indicator}><IconCheck size={14} stroke={1.8} /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className={styles.scroll}><IconChevronDown size={13} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

