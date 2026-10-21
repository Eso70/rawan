"use client";

import { StudioButton, StudioLink, TooltipProvider } from "../../components/ui/tooltip";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { IconBook2, IconUser, IconPlus, IconSearch, IconFileText, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconFeather, IconX, IconArrowLeft, IconLayoutGrid, IconClock, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { StudioHelp } from "./studio-help";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { StudioThemeContext, useStudioThemePreference } from "../../components/ui/studio-theme";
import { CreateBook } from "./create-book";
import { FormInput as TextInput } from "../../components/ui/form-input";
import { BookWorkspace } from "./book-workspace";
import { useStudioAtmosphere } from "./use-studio-atmosphere";
import type { BookDetails, PreviewBook, PreviewChapter } from "./book-preview";
import styles from "./author-desk.module.css";
import bookStyles from "./book-studio.module.css";

export function AuthorDesk() {
  const reducedMotion = useReducedMotion();
  const { theme, toggleTheme } = useStudioThemePreference();
  const backgroundSrc = useStudioAtmosphere();
  const [books, setBooks] = useState<PreviewBook[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTime, setLocalTime] = useState("");
  const brandButton = useRef<HTMLButtonElement>(null);
  const creationTrigger = useRef<HTMLElement | null>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const documentMenu = useRef<HTMLDivElement>(null);
  const active = books.find((book) => book.id === selected);

  useEffect(() => {
    const update = () => setLocalTime(new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date()));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!creating) return;
    document.getElementById("book-title")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("#studio-help:popover-open")) return;
      setCreating(false);
      requestAnimationFrame(() => creationTrigger.current?.focus());
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [creating]);
  useEffect(() => {
    if (!navigationOpen || creating || menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("#studio-help:popover-open")) return;
      setNavigationOpen(false);
      brandButton.current?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [navigationOpen, creating, menuOpen]);

  const openCreateBook = () => { creationTrigger.current = documentMenu.current?.contains(document.activeElement) ? menuTrigger.current : document.activeElement instanceof HTMLElement ? document.activeElement : null; documentMenu.current?.hidePopover(); setCreating(true); };
  const cancelCreateBook = () => { setCreating(false); requestAnimationFrame(() => creationTrigger.current?.focus()); };
  const showBooks = () => { setCreating(false); setSelected(null); };
  const openDocumentMenu = (event: MouseEvent<HTMLButtonElement>) => {
    const menu = documentMenu.current;
    if (!menu) return;
    menuTrigger.current = event.currentTarget;
    const bounds = event.currentTarget.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - 218))}px`;
    menu.style.top = `${Math.min(bounds.bottom + 7, window.innerHeight - 110)}px`;
    menu.togglePopover();
  };
  const createBook = (details: BookDetails) => {
    const book: PreviewBook = { id: crypto.randomUUID(), ...details, chapters: [] };
    setBooks((current) => [...current, book]);
    setSelected(book.id); setChapterId(null); setSearch(""); setCreating(false);
  };
  const addChapter = () => {
    if (!active) return;
    const chapter: PreviewChapter = { id: crypto.randomUUID(), title: `Chapter ${active.chapters.length + 1}`, html: "<p></p>", words: 0 };
    setBooks((current) => current.map((book) => book.id === active.id ? { ...book, chapters: [...book.chapters, chapter] } : book));
    setChapterId(chapter.id);
  };
  const updateChapter = (id: string, patch: Partial<Pick<PreviewChapter, "title" | "html" | "words" | "headerImage">>) => {
    setBooks((current) => current.map((book) => book.id === selected ? { ...book, chapters: book.chapters.map((chapter) => chapter.id === id ? { ...chapter, ...patch } : chapter) } : book));
  };
  const visibleBooks = books.filter((book) => `${book.title} ${book.subtitle}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <StudioThemeContext.Provider value={theme}>
    <TooltipProvider>
    <MotionConfig transition={{ duration: reducedMotion ? 0 : .34, ease: [.22, 1, .36, 1] }}>
      <div data-studio-theme={theme} className={`${styles.desk} ${styles.bookOnly} ${creating ? styles.creatingBook : ""} ${active ? styles.hasBook : ""} ${collapsed ? styles.collapsed : ""} ${navigationOpen ? styles.navigationOpen : ""}`}>
        <StudioLink className={styles.skip} href="#author-workspace">Skip to writing space</StudioLink>
        <StudioButton ref={brandButton} className={styles.brand} aria-label="Rawan navigation" aria-expanded={navigationOpen} aria-controls="rawan-navigation" title={navigationOpen ? "Close Rawan navigation" : "Open Rawan navigation"} onClick={() => setNavigationOpen(!navigationOpen)}><img src="/brand/logo.svg" width="19" height="19" alt="" /></StudioButton>
        <nav id="rawan-navigation" className={styles.navigation} aria-label="Rawan" aria-hidden={!navigationOpen} inert={!navigationOpen}>
          <StudioButton title="Your books" aria-label="Your books" onClick={() => { setCollapsed(false); showBooks(); }}><IconLayoutGrid size={19} stroke={1.6} /></StudioButton>
          <StudioLink href="/account" className={styles.accountIcon} title="Your account" aria-label="Your account"><IconUser size={17} /></StudioLink>
          <span className={styles.navigationDivider} />
          <StudioButton className={styles.currentStudio} title="Author Studio" aria-label="Author Studio" aria-current="page" onClick={showBooks}><IconFeather size={22} stroke={1.6} /></StudioButton>
          <StudioButton className={styles.navigationCreate} title="New Book" aria-label="New Book" onClick={openCreateBook}><IconPlus size={19} stroke={1.5} /></StudioButton>
          <div className={styles.navigationBottom}><StudioLink href="/" title="Back to Rawan" aria-label="Back to Rawan"><IconArrowLeft size={19} /></StudioLink></div>
        </nav>
        <section className={styles.writingScreen} aria-label="Writing dashboard">
          <div className={styles.atmosphere} aria-hidden="true" />
          {backgroundSrc && <div className={styles.backgroundPhoto} style={{ backgroundImage: `linear-gradient(var(--studio-photo-shade-top, #071a2b66), var(--studio-photo-shade-bottom, #06162599)), url("${backgroundSrc}")` }} aria-hidden="true" />}
          <div className={styles.atmosphereShade} aria-hidden="true" />
          <header className={styles.rail}>
            <StudioButton className={styles.project} tooltip="Return to your books" onClick={showBooks}><span className={styles.projectMark}><IconBook2 size={16} /></span>My Books</StudioButton>
            <StudioButton className={styles.workspaceTab} tooltip="Author Studio home" onClick={showBooks}><IconFeather size={15} />Author Studio</StudioButton>
            {active && <div className={bookStyles.bookTab}><StudioButton onClick={() => { setCreating(false); setSelected(active.id); }} title={active.title}><IconBook2 size={14} /><span className={bookStyles.tabTitle}>{active.title}</span></StudioButton><StudioButton className={bookStyles.tabClose} aria-label="Close book tab" onClick={showBooks}><IconX size={13} /></StudioButton></div>}
            <StudioButton className={styles.addTab} title="New Document" aria-label="New Document" aria-expanded={menuOpen} aria-controls="new-document-menu" onClick={openDocumentMenu}><IconPlus size={17} /></StudioButton>
            <div className={styles.utilities}><StudioButton className={styles.themeToggle} aria-label="Light mode" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} role="switch" aria-checked={theme === "light"} onClick={toggleTheme}>{theme === "dark" ? <IconSun size={16}/> : <IconMoon size={16}/>}</StudioButton><StudioButton tooltip="Studio guides and support" popoverTarget="studio-help">Help</StudioButton><IconClock size={13} /><time aria-label="Local time">{localTime}</time></div>
          </header>
          <aside className={styles.sidebar} aria-label={collapsed ? "Collapsed book navigation" : "Your books"}>
            <motion.div initial={false} animate={{ opacity: collapsed ? 1 : 0, x: collapsed ? 0 : -4 }} className={styles.collapsedRail} aria-hidden={!collapsed} inert={!collapsed}>
              <StudioButton title="Show books" aria-label="Show books" onClick={() => setCollapsed(false)}><IconLayoutSidebarLeftExpand size={17} /></StudioButton>
              <StudioButton className={styles.railCreate} title="New Document" aria-label="New Document" onClick={openDocumentMenu}><IconPlus size={18} stroke={1.5} /></StudioButton>
            </motion.div>
            <motion.div initial={false} animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -8 : 0 }} className={styles.sidebarContent} aria-hidden={collapsed} inert={collapsed}>
              <div className={styles.sidebarTop}>
                <div className={styles.search}><IconSearch size={15} /><TextInput type="search" aria-label="Search books" placeholder="Search books…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                <StudioButton title="New Document" aria-label="New Document" onClick={openDocumentMenu}><IconPlus size={16} /></StudioButton>
                <StudioButton title="Hide books" aria-label="Hide books" onClick={() => setCollapsed(true)}><IconLayoutSidebarLeftCollapse size={16} /></StudioButton>
              </div>
              <StudioButton className={bookStyles.newBook} tooltip="Start a new book" onClick={openCreateBook}><IconPlus size={15} />New Book</StudioButton>
              {books.length === 0 ? <div className={styles.empty}><span className={styles.emptyIcon}><IconBook2 size={23} stroke={1.5} /></span><p>No books yet.</p><span className={bookStyles.sidebarLabel}>Your next story starts here</span></div> : (
                <nav className={bookStyles.bookList} aria-label="Books">
                  <div className={bookStyles.sidebarLabel}>Manuscripts</div>
                  {visibleBooks.length === 0 && <p className={styles.noResults}>No matching books.</p>}
                  {visibleBooks.map((book) => <div key={book.id}>
                    <StudioButton className={bookStyles.bookRow} tooltip={book.title} aria-current={book.id === selected ? "page" : undefined} onClick={() => { setSelected(book.id); setChapterId(book.chapters[0]?.id ?? null); }}>
                      {book.id === selected ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}<IconBook2 size={15} /><span>{book.title}</span>
                    </StudioButton>
                    {book.id === selected && <div className={bookStyles.chapterList}>
                      {book.chapters.map((chapter) => <StudioButton key={chapter.id} className={bookStyles.chapterRow} tooltip={chapter.title || "Untitled chapter"} aria-current={chapter.id === chapterId ? "page" : undefined} onClick={() => setChapterId(chapter.id)}><IconFileText size={13} /><span>{chapter.title || "Untitled chapter"}</span></StudioButton>)}
                      <StudioButton className={bookStyles.chapterRow} tooltip="Add a chapter to this book" onClick={addChapter}><IconPlus size={13} />{book.chapters.length ? "New chapter" : "Create First Chapter"}</StudioButton>
                    </div>}
                  </div>)}
                </nav>
              )}
            </motion.div>
          </aside>
          <main className={styles.workspace} id="author-workspace">
            {creating ? <CreateBook onCreate={createBook} onCancel={cancelCreateBook} /> : active ? <BookWorkspace book={active} chapterId={chapterId} onAddChapter={addChapter} onChangeChapter={(id, html, words) => updateChapter(id, { html, words })} onRenameChapter={(id, title) => updateChapter(id, { title })} onHeaderImageChange={(id, headerImage) => updateChapter(id, { headerImage })} onDesignChange={(design) => setBooks((current) => current.map((book) => book.id === active.id ? { ...book, design } : book))} /> : (
              <section className={styles.launcher} aria-label="Book creation">
                <p className={styles.intro}>A space for your books</p>
                <div className={styles.path}><span><IconFeather size={15} /></span>Author Studio</div>
                <div className={styles.tools}><StudioButton className={styles.tool} tooltip="Choose a title, cover, and book type" style={{ width: 90 }} onClick={openCreateBook}><span className={styles.toolTile}><IconBook2 size={25} stroke={1.6} /></span><span>Create Book</span></StudioButton></div>
              </section>
            )}
          </main>
          <StudioHelp />
        </section>
        <div ref={documentMenu} id="new-document-menu" popover="auto" className={bookStyles.documentMenu} onToggle={(event) => setMenuOpen(event.newState === "open")}>
          <h3>New Document</h3><StudioButton tooltip="Create a book and start your manuscript" onClick={openCreateBook}><IconBook2 size={20} stroke={1.5} /><span>Book<small>A home for your manuscript</small></span></StudioButton>
        </div>
      </div>
    </MotionConfig>
    </TooltipProvider>
    </StudioThemeContext.Provider>
  );
}
