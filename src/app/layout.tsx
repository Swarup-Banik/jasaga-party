import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JASAGA PARTY - Collaborative Watch Party & Cloud Browser",
  description:
    "Watch streams, browse the web collaboratively with an embedded Hyperbeam virtual browser, and chat with friends in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-theater-950 text-slate-100 antialiased selection:bg-brand-purple/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
