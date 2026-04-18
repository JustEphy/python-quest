import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Python Quest",
  description: "Gamified Python learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
