import type { Metadata } from "next";
import { LibraryPage } from "../../components/library/library-page";

export const metadata: Metadata = {
  title: "Library — Rawan",
  description:
    "A little room for other worlds. Explore Rawan’s preview bookshelf.",
};

export default function Page() {
  return <LibraryPage />;
}
