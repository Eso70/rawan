import Image from "next/image";
import type { books } from "./books";
import styles from "./library.module.css";

export function BookCard({
  book,
  priority = false,
}: {
  book: (typeof books)[number];
  priority?: boolean;
}) {
  return (
    <article id={`book-${book.slug}`} className={styles.book} tabIndex={-1}>
      <div className={styles.coverStage}>
        <div className={styles.cover}>
          <Image
            src={`/images/library/${book.slug}.jpg`}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 479px) 100px, 120px"
            priority={priority}
          />
        </div>
      </div>
      <div className={styles.bookInfo}>
        <p className={styles.genre}>{book.genre}</p>
        <h3>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>
      </div>
    </article>
  );
}
