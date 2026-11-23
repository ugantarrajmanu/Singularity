import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Singularity — युग",
  description:
    "Engineering Beyond Limits. An interactive 3D portfolio: compilers, systems programming and production software engineering.",
  openGraph: {
    title: "Singularity — युग",
    description: "Engineering Beyond Limits.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090914",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      {/* Browser extensions (e.g. ColorZilla) inject attributes on <body>. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
