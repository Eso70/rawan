import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rawan — Your stories, your worlds",
  description:
    "A home for your stories. Write, organize, and build the worlds you imagine with Rawan.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/brand/logo.png", sizes: "512x512", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
