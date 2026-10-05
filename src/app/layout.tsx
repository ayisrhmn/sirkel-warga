import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Tells the browser to draw its own controls light as well.
export const viewport: Viewport = { colorScheme: "light" };

export const metadata: Metadata = {
  title: "Sirkel",
  description:
    "Tempat warga lihat pengumuman, agenda, kontak penting, dan laporan lingkungan.",
  robots: { index: false, follow: false },
};

// Both are variable fonts, self-hosted at build time (no request to Google
// from the visitor's phone). Headings use the display font, the rest the body font.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-base leading-relaxed text-ink">
        {children}
      </body>
    </html>
  );
}
