import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOOM: BIO-DEFENDER 3D — System Infection Lockdown",
  description: "A retro 3D FPS Doom-style shooter where you purge viruses, bacteria, and infected leukocyte necromancers across 9 organ systems.",
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
