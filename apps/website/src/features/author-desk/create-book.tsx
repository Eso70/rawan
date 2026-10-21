"use client";

import { StudioButton } from "../../components/ui/tooltip";

import { useRef, useState } from "react";
import { IconBook2, IconPhotoPlus, IconX, IconArrowRight, IconArrowLeft, IconPalette, IconUpload } from "@tabler/icons-react";
import { Dropdown } from "../../components/ui/dropdown";
import { FormInput as TextInput } from "../../components/ui/form-input";
import dynamic from "next/dynamic";
import { defaultCoverStyle, coverColors } from "./book-cover-style";
import { bookTypes, type BookDetails, type BookCovers, type CoverSide } from "./book-preview";
import styles from "./book-studio.module.css";
const BookObject = dynamic(() => import("./book-object").then((module) => module.BookObject), { ssr: false, loading: () => <div className={styles.loadingBook}>Opening your book…</div> });
const setupTabs = [{ id: "details", label: "Book details", Icon: IconBook2 }, { id: "design", label: "Cover design", Icon: IconPalette }, { id: "artwork", label: "Artwork", Icon: IconPhotoPlus }];

export function CreateBook({ onCreate, onCancel }: { onCreate: (details: BookDetails) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState<string>("Novel");
  const [section, setSection] = useState("details");
  const [view, setView] = useState<CoverSide>("front");
  const [viewRequest, setViewRequest] = useState(0);
  const [coverStyle, setCoverStyle] = useState(defaultCoverStyle);
  const [artworkSide, setArtworkSide] = useState<CoverSide>("front");
  const [covers, setCovers] = useState<BookCovers>({ front: null, back: null, spine: null });
  const [imageError, setImageError] = useState("");
  const [loadingCover, setLoadingCover] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const uploadSide = useRef<CoverSide>("front");
  const displayTitle = title.trim() || "Untitled book";
  const changeView = (side: CoverSide) => { setView(side); setViewRequest((value) => value + 1); };
  const readCover = (image: File, side: CoverSide) => {
    setImageError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) { setImageError("Choose a PNG, JPEG, or WebP cover under 5 MB."); return; }
    setLoadingCover(true); const reader = new FileReader();
    reader.onload = () => { const src = typeof reader.result === "string" ? reader.result : null; setCovers((current) => ({ ...current, [side]: src })); setLoadingCover(false); changeView(side); };
    reader.onerror = () => { setImageError("This cover could not be opened."); setLoadingCover(false); }; reader.readAsDataURL(image);
  };

  return (
    <section className={styles.creationWorkspace} aria-label="Create Book">
      <StudioButton type="button" className={styles.backToBooks} tooltip="Return to your books without creating this book" onClick={onCancel}><IconArrowLeft size={15} />Back to books</StudioButton>
      <form className={styles.createLayout} onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) { setSection("details"); requestAnimationFrame(() => document.getElementById("book-title")?.focus()); return; }
        if (!loadingCover) onCreate({ title: title.trim(), subtitle: subtitle.trim(), type, covers, coverStyle });
      }}>
        <div className={styles.bookStage}>
          <BookObject title={displayTitle} subtitle={subtitle} covers={covers} style={coverStyle} view={view} viewRequest={viewRequest} />
          <div className={styles.bookViews} role="group" aria-label="View book cover">{(["front", "spine", "back"] as const).map((side) => <StudioButton type="button" key={side} tooltip={`Turn to the ${side} cover view`} onClick={() => changeView(side)}>{side === "front" ? "Front" : side === "back" ? "Back" : "Spine"}</StudioButton>)}</div>
        </div>
        <div className={styles.createFields}>
          <div className={styles.creationIdentity}><span>YOUR NEXT BOOK</span><h1 id="create-book-heading">{displayTitle}</h1>{subtitle.trim() && <p>{subtitle}</p>}</div>
          <div className={styles.setupTabs} role="tablist" aria-label="Book setup">{setupTabs.map(({ id, label, Icon }, index) => <StudioButton key={id} type="button" id={`book-${id}-tab`} role="tab" aria-selected={section === id} aria-controls={`book-${id}-panel`} tabIndex={section === id ? 0 : -1} onClick={() => setSection(id)} onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault(); const next = setupTabs[event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3].id; setSection(next); document.getElementById(`book-${next}-tab`)?.focus();
          }}><Icon size={16} />{label}</StudioButton>)}</div>
          <div id="book-details-panel" role="tabpanel" aria-labelledby="book-details-tab" hidden={section !== "details"}>
            <div className={styles.metadata}>
              <label htmlFor="book-title">Book title <span>Required</span></label>
              <TextInput id="book-title" maxLength={100} placeholder="Give your book a title" aria-required="true" value={title} onChange={(event) => setTitle(event.target.value)} />
              <label htmlFor="book-subtitle">Subtitle <span>Optional</span></label>
              <TextInput id="book-subtitle" maxLength={200} placeholder="Add a subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
              <label htmlFor="book-type">Book type</label>
              <Dropdown id="book-type" label="Book type" value={type} onValueChange={setType} options={bookTypes.map((value) => ({ value, label: value }))} />
            </div>
          </div>
          <div id="book-design-panel" role="tabpanel" aria-labelledby="book-design-tab" hidden={section !== "design"}>
            <div className={styles.coverDesignFields}>
              <label className={styles.designLabel}>Cover layout<Dropdown label="Cover layout" value={coverStyle.layout} onValueChange={(layout) => setCoverStyle((current) => ({ ...current, layout: layout as typeof current.layout }))} options={[{ value: "arch", label: "Arch · Quiet geometry" },{ value: "editorial", label: "Editorial · Bold type" },{ value: "orbit", label: "Orbit · Celestial lines" }]} /></label>
              <div className={styles.colorChoices} role="group" aria-label="Cover color">{coverColors.map((color) => <StudioButton type="button" key={color.value} aria-label={color.label} aria-pressed={coverStyle.color === color.value} style={{ backgroundColor: color.value }} onClick={() => setCoverStyle((current) => ({ ...current, color: color.value }))}><span>{color.label}</span></StudioButton>)}</div>
              <label className={styles.designLabel}>Finish<Dropdown label="Cover finish" value={coverStyle.finish} onValueChange={(finish) => setCoverStyle((current) => ({ ...current, finish: finish as "linen" | "matte" }))} options={[{ value: "linen", label: "Woven linen" },{ value: "matte", label: "Smooth matte" }]} /></label>
              <label className={styles.designLabel}>Book thickness<Dropdown label="Book thickness" value={String(coverStyle.thickness)} onValueChange={(thickness) => setCoverStyle((current) => ({ ...current, thickness: Number(thickness) }))} options={[{ value: "0.14", label: "Slim" },{ value: "0.24", label: "Standard" },{ value: "0.4", label: "Substantial" }]} /></label>
              <p className={styles.imageHint}>Uploaded artwork replaces the design on its cover.</p>
            </div>
          </div>
          <div id="book-artwork-panel" role="tabpanel" aria-labelledby="book-artwork-tab" hidden={section !== "artwork"}>
            <div className={styles.artworkSides} role="group" aria-label="Choose artwork side">{(["front","back","spine"] as const).map((side) => <StudioButton type="button" key={side} aria-pressed={artworkSide === side} onClick={() => { setArtworkSide(side); changeView(side); }}>{side[0].toUpperCase()+side.slice(1)}<span>{covers[side] ? "Added" : "Optional"}</span></StudioButton>)}</div>
            <div className={styles.artworkDrop} data-filled={!!covers[artworkSide]} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect="copy"; }} onDrop={(event) => { event.preventDefault(); const image=event.dataTransfer.files[0]; if(image && !loadingCover) readCover(image,artworkSide); }}>
              <StudioButton type="button" disabled={loadingCover} aria-label={`${covers[artworkSide] ? "Replace" : "Upload"} ${artworkSide} artwork`} className={styles.artworkBrowse} onClick={() => { uploadSide.current=artworkSide; file.current?.click(); }}>
                {covers[artworkSide] ? <img src={covers[artworkSide]} alt={artworkSide+" artwork"} /> : <IconUpload size={30} stroke={1.3}/>}
                <strong>{loadingCover ? "Opening artwork…" : covers[artworkSide] ? "Replace artwork" : "Drop your artwork here"}</strong><span>{covers[artworkSide] ? "Choose another image" : "or click to browse"}</span>
              </StudioButton>
              {covers[artworkSide] && <StudioButton type="button" className={styles.removeArtwork} aria-label={`Remove ${artworkSide} artwork`} disabled={loadingCover} onClick={() => setCovers((current) => ({...current,[artworkSide]:null}))}><IconX size={14}/>Remove</StudioButton>}
            </div>
            <p className={styles.imageHint}>PNG, JPEG or WebP · Up to 5 MB · Each side is optional</p>
          </div>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => {
            const image = event.target.files?.[0]; const side = uploadSide.current; event.target.value = "";
            if (image) readCover(image,side);
          }} />
          {imageError && <p role="alert" className={styles.formError}>{imageError}</p>}
          <footer className={styles.createFooter}><StudioButton type="submit" tooltip={!title.trim() ? "Add a book title to continue" : loadingCover ? "Wait for your artwork to finish opening" : "Create your book and open its manuscript"} disabled={!title.trim() || loadingCover}>Create Book <IconArrowRight size={16} /></StudioButton></footer>
        </div>
      </form>
    </section>
  );
}

