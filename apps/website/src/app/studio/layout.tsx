import type { ReactNode } from "react";
export const metadata = {
  title: "Author Studio — Rawan",
  robots: { index: false, follow: false },
};
export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
