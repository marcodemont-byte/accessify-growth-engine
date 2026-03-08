import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accessify Event Intelligence",
  description: "Internal dashboard for event discovery and lead management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
