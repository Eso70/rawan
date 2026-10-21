"use client";

import { StudioButton } from "../../components/ui/tooltip";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconPrinter,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Dropdown } from "../../components/ui/dropdown";
import type { BookDesign } from "./book-design";
import type { PreviewBook } from "./book-preview";
import type { BookFont } from "./use-font-library";
import { liveBookSnapshot } from "./book-live-preview";
import { typesetDocument } from "./book-typesetting";
import { useStudioTheme } from "../../components/ui/studio-theme";
import styles from "./book-workspace.module.css";

export type PaginationInfo = { page: number; total: number; busy: boolean };
export function BookPrintView({
  book,
  design,
  fonts,
  onClose,
  mode = "full",
  zoomValue,
  onPagination,
}: {
  book: PreviewBook;
  design: BookDesign;
  fonts: BookFont[];
  onClose?: () => void;
  mode?: "full" | "preview";
  zoomValue?: string;
  onPagination?: (info: PaginationInfo) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const theme = useStudioTheme();
  const currentTheme = useRef(theme);
  currentTheme.current = theme;
  const frames = useRef<Array<HTMLIFrameElement | null>>([null, null]);
  const active = useRef(0);
  const [activeFrame, setActiveFrame] = useState(0);
  const [sources, setSources] = useState(["", ""]);
  const [status, setStatus] = useState("Preparing your book…");
  const [info, setInfo] = useState<PaginationInfo>({
    page: 1,
    total: 0,
    busy: true,
  });
  const [zoom, setZoom] = useState("0.75");
  const [generation, setGeneration] = useState(0);
  const token = useRef("");
  const callback = useRef(onPagination);
  callback.current = onPagination;
  const previous = useRef(info);
  previous.current = info;
  useLayoutEffect(() => {
    if (mode === "preview" && token.current)
      frame.current?.contentWindow?.postMessage(
        {
          type: "rawan-live-update",
          token: token.current,
          chapters: liveBookSnapshot(book),
        },
        "*",
      );
  }, [book, mode]);
  useEffect(() => {
    let cancelled = false;
    const nextFrame = 1 - active.current;
    const currentToken = crypto.randomUUID();
    const publish = (next: PaginationInfo) => {
      setInfo(next);
      callback.current?.(next);
    };
    publish({ ...previous.current, busy: true });
    if (!previous.current.total) setStatus("Preparing your book…");
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (
        event.source === frame.current?.contentWindow &&
        data?.token === token.current &&
        data.type === "rawan-page-position" &&
        Number.isInteger(data.page) &&
        data.page > 0
      ) {
        setInfo((current) => ({
          ...current,
          page: Math.min(current.total || 1, data.page),
        }));
        return;
      }
      if (
        event.source !== frames.current[nextFrame]?.contentWindow ||
        data?.token !== currentToken
      )
        return;
      if (
        data.type === "rawan-typeset-ready" &&
        Number.isInteger(data.pages) &&
        data.pages > 0
      ) {
        const oldPage = Math.min(previous.current.page, data.pages);
        active.current = nextFrame;
        frame.current = frames.current[nextFrame];
        token.current = currentToken;
        setActiveFrame(nextFrame);
        publish({ page: oldPage, total: data.pages, busy: false });
        setStatus("");
        frame.current?.contentWindow?.postMessage(
          {
            type: "rawan-theme",
            token: currentToken,
            theme: currentTheme.current,
          },
          "*",
        );
        frame.current?.contentWindow?.postMessage(
          {
            type: "rawan-zoom",
            token: currentToken,
            value: (zoomValue ?? "fit") === "fit" ? "fit" : Number(zoomValue),
          },
          "*",
        );
        frame.current?.contentWindow?.postMessage(
          { type: "rawan-page", token: currentToken, page: oldPage },
          "*",
        );
      }
      if (data.type === "rawan-typeset-error") {
        setStatus("The book could not be prepared. Please try again.");
        publish({ page: 1, total: 0, busy: false });
      }
    };
    window.addEventListener("message", receive);
    // Begin on the edit itself: no debounce or artificial wait. Keep the current rendered frame visible.
    void typesetDocument(
      book,
      design,
      fonts,
      currentToken,
      currentTheme.current,
      mode === "preview",
    )
      .then((html) => {
        if (!cancelled)
          setSources((current) =>
            current.map((value, index) => (index === nextFrame ? html : value)),
          );
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("The book could not be prepared. Please try again.");
          publish({ page: 1, total: 0, busy: false });
        }
      });
    return () => {
      cancelled = true;
      window.removeEventListener("message", receive);
    };
  }, [book, design, fonts, generation, mode]);
  const displayZoom = mode === "preview" ? (zoomValue ?? "fit") : zoom;
  useEffect(() => {
    if (info.total && !info.busy)
      frame.current?.contentWindow?.postMessage(
        {
          type: "rawan-zoom",
          token: token.current,
          value: displayZoom === "fit" ? "fit" : Number(displayZoom),
        },
        "*",
      );
  }, [displayZoom, info.total, info.busy]);
  useEffect(() => {
    if (info.total)
      frame.current?.contentWindow?.postMessage(
        {
          type: "rawan-theme",
          token: token.current,
          theme,
          instant: document.documentElement.hasAttribute(
            "data-studio-theme-reveal",
          ),
        },
        "*",
      );
  }, [theme, info.total, info.busy]);
  return (
    <div className={styles.printView}>
      <header className={styles.printTools}>
        {mode === "preview" ? (
          <strong>Live preview</strong>
        ) : (
          <StudioButton
            tooltip="Return to your manuscript editor"
            onClick={onClose}
          >
            <IconArrowLeft size={15} />
            Back to writing
          </StudioButton>
        )}
        <span role="status">
          {info.total
            ? `Page ${info.page} of ${info.total}`
            : "Calculating pages…"}
        </span>
        <StudioButton
          aria-label="Previous preview page"
          disabled={info.busy || info.page <= 1}
          onClick={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "rawan-page", token: token.current, page: info.page - 1 },
              "*",
            )
          }
        >
          <IconChevronLeft size={14} />
        </StudioButton>
        <StudioButton
          aria-label="Next preview page"
          disabled={info.busy || info.page >= info.total}
          onClick={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "rawan-page", token: token.current, page: info.page + 1 },
              "*",
            )
          }
        >
          <IconChevronRight size={14} />
        </StudioButton>
        {mode === "full" && (
          <Dropdown
            label="Book zoom"
            variant="compact"
            value={zoom}
            onValueChange={setZoom}
            options={[
              { value: "fit", label: "Fit page" },
              { value: "0.5", label: "50%" },
              { value: "0.75", label: "75%" },
              { value: "1", label: "100%" },
            ]}
          />
        )}
        <StudioButton
          aria-label="Print / PDF"
          tooltip="Open the browser print dialog to print or save a PDF"
          disabled={!info.total || info.busy || !!status}
          onClick={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "rawan-print", token: token.current },
              "*",
            )
          }
        >
          <IconPrinter size={15} />
          {mode === "full" && "Print / PDF"}
        </StudioButton>
      </header>
      {!!status && (
        <div className={styles.typesetStatus} role="status">
          {status}
          {status.includes("try again") && (
            <StudioButton onClick={() => setGeneration((value) => value + 1)}>
              Try again
            </StudioButton>
          )}
        </div>
      )}
      <div className={styles.frameStack} data-ready={info.total > 0}>
        {sources.map((source, index) => (
          <iframe
            key={index}
            ref={(node) => {
              frames.current[index] = node;
              if (index === active.current) frame.current = node;
            }}
            title={
              index === activeFrame
                ? mode === "preview"
                  ? "Live paper preview"
                  : "Typeset book pages"
                : "Preparing paper preview"
            }
            className={`${styles.printFrame} ${index === activeFrame ? styles.activeFrame : styles.bufferFrame}`}
            aria-hidden={index !== activeFrame || !info.total}
            inert={index !== activeFrame || !info.total}
            tabIndex={index === activeFrame && info.total ? 0 : -1}
            sandbox="allow-scripts allow-modals"
            srcDoc={source}
          />
        ))}
      </div>
    </div>
  );
}
