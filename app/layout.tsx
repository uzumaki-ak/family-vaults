import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family-Vault",
  description:
    "Preserve and celebrate your familys most cherished moments with Legacy — a secure, shared digital vault for photos, videos, and messages. Upload, organize, and relive your memories together with powerful features like timelines, audio/video support, legacy notes, and voting-based deletion.",

  keywords:
    "family memory vault, digital memory box, legacy photo storage, family photo archive, audio memories, legacy notes, shared family albums, media timeline app, private family gallery",
  authors: { name: "Anikesh" },
  icons: "./logo.png"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
