"use client";
import Image from "next/image";
import {
  IconCards,
  IconPhoto,
  IconMap,
  IconGridDots,
  IconTimeline,
  IconSitemap,
  IconNotes,
  IconUser,
  IconTag,
  IconMapPin,
  IconPlus,
  IconSchool,
  IconX,
  IconDots,
  IconWindow,
  IconChevronDown,
} from "@tabler/icons-react";
import type { OnboardingState } from "../../lib/onboarding";
import styles from "./onboarding.module.css";

export const sampleAbout =
  "The Mirewalker knows every crossing in the flooded basin. Travelers seek her help when the old roads disappear beneath the water. She carries stories between the harbor and the tower, always returning with one more question than she left with.";
export function WindowBar({
  title,
  onTutorial,
}: {
  title?: string;
  onTutorial?: () => void;
}) {
  return (
    <div className={styles.windowBar}>
      {title && (
        <span>
          {title} <IconChevronDown size={12} />
        </span>
      )}
      <div>
        {onTutorial && (
          <button onClick={onTutorial}>
            <IconSchool size={12} /> Tutorial
          </button>
        )}
        <IconDots size={14} />
        <IconWindow size={13} />
        <IconX size={13} />
      </div>
    </div>
  );
}
export function ExampleCard({
  draft,
  onChange,
  onTutorial,
  editable = false,
  showText = true,
  onText,
}: {
  draft: OnboardingState;
  onChange?: (value: Partial<OnboardingState>) => void;
  onTutorial?: () => void;
  editable?: boolean;
  showText?: boolean;
  onText?: () => void;
}) {
  const images = ["mirewalker", "outlook", "harbor"];
  return (
    <section className={styles.card} aria-label="Sample character card">
      <WindowBar onTutorial={onTutorial} />
      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <div>
            <div className={styles.cardTitle}>
              <div data-tour="name">
                {editable ? (
                  <input
                    aria-label="Card name"
                    maxLength={100}
                    value={draft.draftName}
                    onChange={(e) => onChange?.({ draftName: e.target.value })}
                  />
                ) : (
                  <h2>{draft.draftName}</h2>
                )}
              </div>
              <span>
                <IconUser size={13} /> Character
              </span>
            </div>
            <p className={styles.alias}>
              <IconTag size={15} /> Aliases <span>Mire</span>
              <span>The Wayfinder</span>
            </p>
            <div className={styles.facts} data-tour="properties">
              <label>
                <IconPlus size={14} /> {editable ? "Add a property" : "Role"}
                {editable ? (
                  <input
                    aria-label="Character role"
                    placeholder="Add a role"
                    maxLength={100}
                    value={draft.draftRole}
                    onChange={(e) => onChange?.({ draftRole: e.target.value })}
                  />
                ) : (
                  <span>{draft.draftRole}</span>
                )}
              </label>
              {!editable && (
                <>
                  <p>
                    <IconMapPin size={14} /> Residence{" "}
                    <span>Redwake Harbor</span>
                  </p>
                  <p>
                    <IconUser size={14} /> Connections{" "}
                    <span>The Lantern Guild</span>
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            className={styles.portrait}
            data-tour="image"
            disabled={!editable}
            aria-label="Change sample illustration"
            title={editable ? "Choose the next sample illustration" : undefined}
            onClick={() =>
              onChange?.({
                draftImage:
                  images[
                    (images.indexOf(draft.draftImage) + 1) % images.length
                  ],
              })
            }
          >
            <Image
              src={`/images/creators/${draft.draftImage}.avif`}
              alt="Illustration from the sample world"
              fill
              sizes="(max-width: 700px) 130px, 200px"
            />
            {editable && (
              <span>
                <IconPhoto size={14} /> Change image
              </span>
            )}
          </button>
        </div>
        <section className={styles.about}>
          <h3>About</h3>
          <p>{sampleAbout}</p>
          {!editable && draft.draftText && <p>{draft.draftText}</p>}
          {showText && editable && (
            <textarea
              aria-label="Your character story"
              placeholder="Write a line about your character…"
              maxLength={5000}
              value={draft.draftText}
              onChange={(e) => onChange?.({ draftText: e.target.value })}
            />
          )}
        </section>
        {!editable && (
          <section className={styles.about}>
            <h3>Story notes</h3>
            <p>
              A sealed letter from the harbor arrives at the tower. The flood
              has uncovered a road no map remembers. Who built it, and why did
              the guild keep it hidden?
            </p>
          </section>
        )}
        <div className={styles.blockTools}>
          <button data-tour="text" onClick={onText} disabled={!editable}>
            <IconNotes size={15} /> Text
          </button>
          {[
            { Icon: IconPhoto, label: "Media" },
            { Icon: IconMap, label: "Map" },
            { Icon: IconGridDots, label: "Canvas" },
            { Icon: IconTimeline, label: "Timeline" },
            { Icon: IconSitemap, label: "Relations" },
            { Icon: IconCards, label: "Note" },
          ].map(({ Icon, label }) => (
            <span key={label}>
              <Icon size={15} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
export function ExampleCanvas() {
  return (
    <section
      className={`${styles.canvas} ${styles.dots}`}
      aria-label="Sample author canvas"
    >
      <WindowBar title="Author Canvas" />
      <div className={styles.board}>
        <aside className={styles.sticky}>
          <strong>Project Lumia</strong>
          <p>
            Genre: Fantasy
            <br />
            Draft: A road beneath the water
          </p>
          <strong>To do</strong>
          <p>
            ☑ Find the first crossing
            <br />☐ Follow the letter
          </p>
        </aside>
        <section className={styles.moodboard}>
          <span>Moodboard</span>
          <div>
            {["harbor", "outlook", "mirewalker", "larkspire"].map((image) => (
              <Image
                key={image}
                src={`/images/creators/${image}.avif`}
                alt={image}
                width={160}
                height={180}
              />
            ))}
          </div>
        </section>
        <div className={styles.graphPreview}>
          <Image
            src="/images/toolkit/visual-connections.png"
            alt="Sample world connections"
            fill
            sizes="320px"
          />
        </div>
        <div className={styles.boardMap}>
          <Image
            src="/images/creators/world-map.avif"
            alt="Lumia world map"
            fill
            sizes="320px"
          />
        </div>
        <section className={styles.outline}>
          <span>Plot outline</span>
          <div>
            {[
              "A sealed letter",
              "The flooded road",
              "The forgotten tower",
              "A choice at dawn",
            ].map((text, i) => (
              <div key={text}>
                <article>
                  <strong>Chapter {i + 1}</strong>
                  <p>{text}</p>
                </article>
                <Image
                  src={`/images/creators/${["harbor", "mirewalker", "outlook", "larkspire"][i]}.avif`}
                  alt="Story inspiration"
                  width={150}
                  height={190}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
export function ExampleMap() {
  return (
    <section
      className={`${styles.map} ${styles.dots}`}
      aria-label="Sample interactive map"
    >
      <WindowBar title="Lumia" />
      <div className={styles.mapImage}>
        <Image
          src="/images/creators/world-map.avif"
          alt="Map of the sample world Lumia"
          fill
          sizes="(max-width: 700px) 90vw, 650px"
        />
        {[
          { name: "Redwake Harbor", x: 22, y: 30 },
          { name: "The Larkspire", x: 64, y: 24 },
          { name: "Harrowdeep", x: 38, y: 52 },
          { name: "Mirewalker Camp", x: 59, y: 70 },
        ].map((pin) => (
          <span
            className={styles.mapPin}
            key={pin.name}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <IconMapPin size={21} />
            <small>{pin.name}</small>
          </span>
        ))}
      </div>
    </section>
  );
}
