import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { site } from "@/lib/site";
import "./globals.css";

/** Body, navigation, buttons, subtitles and labels. */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

/** All headings (Semibold), matching the hero headline. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: `${site.name} | Private & small-group tours in Armenia`,
  description: site.description,
  icons: { icon: site.logo },
};

export const viewport: Viewport = {
  themeColor: "#fff9f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
