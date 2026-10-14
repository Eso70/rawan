"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IconSearch } from "@tabler/icons-react";
import { books } from "./books";
import styles from "./library-search.module.css";

export function SearchTrigger() {
  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label="Search library (Control K)"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+k Meta+k"
      onClick={() =>
        window.dispatchEvent(new Event("rawan:open-library-search"))
      }
    >
      <IconSearch size={16} stroke={1.5} aria-hidden="true" />
      <span className={styles.triggerLabel}>Search</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}

export function LibrarySearch() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const term = query.trim().toLowerCase();
  const matchingBooks = books.filter((book) =>
    `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(term),
  );
  const resultCount = matchingBooks.length;

  const restoreScroll = () => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    results.current?.scrollTo({ top: 0, behavior: "instant" });
    setActiveBook(null);
  }, [query]);

  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) {
        previousOverflow.current = document.body.style.overflow;
        dialog.current?.showModal();
        document.body.style.overflow = "hidden";
        results.current?.scrollTo({ top: 0, behavior: "instant" });
      }
      input.current?.focus({ preventScroll: true });
    };
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !event.altKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", shortcut);
    window.addEventListener("rawan:open-library-search", open);
    return () => {
      window.removeEventListener("keydown", shortcut);
      window.removeEventListener("rawan:open-library-search", open);
      restoreScroll();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="library-search-title"
      data-lenis-prevent
      onFocusCapture={(event) => {
        const row = (event.target as HTMLElement).closest<HTMLElement>(
          "[data-search-book]",
        );
        setActiveBook(row?.dataset.searchBook ?? null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
        if (
          (event.key === "ArrowDown" || event.key === "ArrowUp") &&
          matchingBooks.length
        ) {
          event.preventDefault();
          const currentIndex = matchingBooks.findIndex(
            (book) => book.slug === activeBook,
          );
          const nextIndex =
            event.key === "ArrowDown"
              ? (currentIndex + 1) % matchingBooks.length
              : currentIndex <= 0
                ? matchingBooks.length - 1
                : currentIndex - 1;
          const next = matchingBooks[nextIndex];
          setActiveBook(next.slug);
          const link = results.current?.querySelector<HTMLAnchorElement>(
            `[data-search-book="${next.slug}"]`,
          );
          link?.focus({ preventScroll: true });
          link?.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      }}
      onClose={() => {
        restoreScroll();
        setQuery("");
        setActiveBook(null);
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close();
      }}
    >
      <h2 id="library-search-title" className={styles.srOnly}>
        Search library
      </h2>
      <div className={styles.searchBar}>
        <IconSearch size={20} stroke={1.5} aria-hidden="true" />
        <label htmlFor="library-search-input" className={styles.srOnly}>
          Search books or authors
        </label>
        <input
          ref={input}
          id="library-search-input"
          type="search"
          placeholder="Search books or authors…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close search"
          className={styles.close}
        >
          esc
        </button>
      </div>
      <p className={styles.srOnly} role="status">
        {term
          ? `${resultCount} ${resultCount === 1 ? "result" : "results"}`
          : "Explore the library"}
      </p>
      <div
        ref={results}
        className={styles.results}
        onPointerLeave={() => {
          const focused = document.activeElement as HTMLElement | null;
          setActiveBook(
            results.current?.contains(focused)
              ? (focused?.closest<HTMLElement>("[data-search-book]")?.dataset
                  .searchBook ?? null)
              : null,
          );
        }}
      >
        {matchingBooks.length > 0 && (
          <section aria-label="Books">
            <h3 className={styles.srOnly}>Books</h3>
            <ul>
              {matchingBooks.map((book) => (
                <li key={book.slug}>
                  <a
                    href={`/library#book-${book.slug}`}
                    onClick={close}
                    data-search-book={book.slug}
                    data-active={activeBook === book.slug}
                    onPointerMove={(event) => {
                      if (event.pointerType !== "touch")
                        setActiveBook(book.slug);
                    }}
                  >
                    <Image
                      className={styles.thumbnail}
                      src={`/images/library/${book.slug}.jpg`}
                      alt=""
                      width={28}
                      height={40}
                      sizes="28px"
                    />
                    <span>
                      {book.title}
                      <small>{book.author}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!matchingBooks.length && (
          <p className={styles.empty}>
            No books found. Try another title or author.
          </p>
        )}
      </div>
      <p className={styles.hint}>
        <span>
          <span aria-hidden="true">↑ ↓</span> navigate
        </span>
        <span>
          <span aria-hidden="true">↵</span> open
        </span>
      </p>
    </dialog>
  );
}
