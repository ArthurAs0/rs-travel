/**
 * Agency facts verified from the public Instagram profile (research brief, 21 Nov 2026).
 * Anything not listed here (phone, email, prices, ratings) is intentionally omitted.
 */
export const site = {
  name: "RP Go Armenia",
  tagline: "Travel. Discover. Experience.",
  description:
    "Private and small-group tours across Armenia, shaped around your interests.",
  instagramUrl: "https://www.instagram.com/rp.go.armenia/",
  instagramHandle: "@rp.go.armenia",
  logo: "/images/brand/rp-go-armenia-logo.jpg",
} as const;

export type NavItem = { label: string; href: string };

/**
 * Main navigation. Destinations is live; the others are mock tabs for the sections
 * planned in Stages 3–4 and start working as each section (with the matching id) is built.
 */
export const navItems: NavItem[] = [
  { label: "Destinations", href: "#places" },
  { label: "How it works", href: "#planning" },
  { label: "Travel styles", href: "#travel-styles" },
  { label: "Stories", href: "#stories" },
  { label: "Contact", href: "#contact" },
];
