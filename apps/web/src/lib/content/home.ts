/**
 * Home page copy and media. Content comes from the RP Go Armenia research brief;
 * nothing here invents prices, ratings, testimonials or bookable packages.
 */

export type HeroContent = {
  eyebrow: string;
  /** Rendered as separate lines, in this order. */
  headline: [string, string];
  copy: string;
  primaryCta: string;
  secondaryCta: string;
  video: {
    /** Ordered: the first source whose `media` query matches is played. */
    sources: { src: string; type: string; media?: string }[];
    /** Matching still frame, shown before the clip plays and if it cannot play. */
    poster: string;
    posterAlt: string;
    /** CSS object-position used to keep the subject in frame on narrow screens. */
    focus: { desktop: string; mobile: string };
    credit?: { label: string; href: string };
  };
};

export const hero: HeroContent = {
  eyebrow: "Armenia · Private & small-group travel",
  headline: ["See Armenia", "at your own pace."],
  copy: "Private and small-group tours, shaped around your interests.",
  primaryCta: "Plan your trip",
  secondaryCta: "Explore destinations",
  video: {
    // Placeholder footage until the agency supplies originals: "Ararat Mountain" by
    // Armen Harutyunyan (Pexels licence, free to use). Re-graded, cropped, looped.
    sources: [
      { src: "/media/hero-armenia-1920.mp4", type: "video/mp4", media: "(min-width: 1024px)" },
      { src: "/media/hero-armenia-1280.mp4", type: "video/mp4" },
    ],
    poster: "/media/hero-armenia-poster.jpg",
    posterAlt: "Mount Ararat rising above vineyards in the Ararat Valley",
    focus: { desktop: "50% 40%", mobile: "51% 50%" },
    credit: {
      label: "Footage: Armen Harutyunyan / Pexels",
      href: "https://www.pexels.com/video/ararat-mountain-19906456/",
    },
  },
};

/** Travel formats, reused by the Stage 3 travel-style cards. */
export type TravelStyle = {
  id: "private" | "small-group" | "custom";
  title: string;
  summary: string;
};

export const travelStyles: TravelStyle[] = [
  {
    id: "private",
    title: "Private tours",
    summary: "Just you and your companions, on a day planned around you.",
  },
  {
    id: "small-group",
    title: "Small-group tours",
    summary: "Share the road with a few fellow travelers.",
  },
  {
    id: "custom",
    title: "Custom itineraries",
    summary: "Places and pace chosen around your interests.",
  },
];

export const placesIntro = {
  eyebrow: "Destinations",
  title: "Places to explore",
  copy: "Cliff-top monasteries in Syunik, autumn forests around Dilijan, the pink-stone streets of Yerevan, and lesser-known landscapes beyond the usual stops.",
};
