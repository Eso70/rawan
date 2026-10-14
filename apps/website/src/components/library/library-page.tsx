"use client";

import { LandingNavigation } from "../landing-navigation";
import { LandingScroll } from "../landing-scroll";
import { SiteFooter } from "../site-footer";
import { books } from "./books";
import { BookCard } from "./book-card";
import { LibrarySearch } from "./library-search";
import styles from "./library.module.css";

export function LibraryPage() {
  return (
    <LandingScroll>
      <div className={`landing-surface ${styles.page}`}>
        <LandingNavigation current="library" />
        <main id="main-content" className={styles.main}>
          <header className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>A home for stories</p>
              <h1>Library</h1>
              <p className={styles.description}>
                Find a story. Step into another world.
              </p>
            </div>
          </header>
          <section
            id="books"
            className={styles.collection}
            aria-labelledby="collection-title"
          >
            <div className={styles.collectionHeader}>
              <div className={styles.collectionTitle}>
                <h2 id="collection-title">All books</h2>
                <span className={styles.count}>{books.length} books</span>
              </div>
            </div>
            <ul className={styles.grid}>
              {books.map((book, index) => (
                <li key={book.slug}>
                  <BookCard book={book} priority={index < 4} />
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              Sample collection · Reading and downloads are coming later.
            </p>
          </section>
        </main>
        <SiteFooter />
        <LibrarySearch />
      </div>
    </LandingScroll>
  );
}
