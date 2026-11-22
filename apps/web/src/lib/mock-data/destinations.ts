/**
 * Destinations for the "Places to explore" carousel. The first entries are places the
 * agency features on its own posts; the rest are well-known Armenian sights added as
 * examples. Descriptions are general editorial copy, not bookable tours.
 * Shaped like a future API response.
 */
export type Destination = {
  slug: string;
  name: string;
  region: string;
  summary: string;
  image: { src: string; alt: string };
  /**
   * Full-width background shown behind the carousel while this card is centred:
   * a looping video when we have footage of the place, otherwise a wide photo.
   */
  backdrop: {
    image: string;
    video?: { sources: { src: string; media?: string }[] };
  };
  /** Where the photo came from (see MEDIA.md). */
  credit: string;
  /** True when the agency itself posted about this place. */
  featuredByAgency?: boolean;
};

export const destinations: Destination[] = [
  {
    slug: "tatev-monastery",
    name: "Tatev Monastery",
    region: "Syunik",
    summary: "A medieval monastery set above cliffs and deep gorges in southern Armenia.",
    image: {
      src: "/images/destinations/tatev-monastery.jpg",
      alt: "Tatev Monastery on a cliff edge above a green mountain gorge",
    },
    backdrop: { image: "/images/destinations/backdrops/tatev-monastery.jpg" },
    credit: "RP Go Armenia",
    featuredByAgency: true,
  },
  {
    slug: "haghartsin-monastery",
    name: "Haghartsin Monastery",
    region: "Tavush",
    summary: "Medieval stone churches hidden in the forested hills above Dilijan.",
    image: {
      src: "/images/destinations/haghartsin-monastery.jpg",
      alt: "Haghartsin Monastery among misty forested hills",
    },
    backdrop: {
      image: "/media/places/haghartsin-poster.jpg",
      video: {
        sources: [
          { src: "/media/places/haghartsin-1600.mp4", media: "(min-width: 768px)" },
          { src: "/media/places/haghartsin-960.mp4" },
        ],
      },
    },
    credit: "Ash Haghighi / Pexels",
    featuredByAgency: true,
  },
  {
    slug: "dilijan",
    name: "Dilijan",
    region: "Tavush",
    summary: "A green mountain town wrapped in forest, often called Armenia's Switzerland.",
    image: {
      src: "/images/destinations/dilijan.jpg",
      alt: "Aerial view of Dilijan surrounded by green hills and low mist",
    },
    backdrop: { image: "/images/destinations/backdrops/dilijan.jpg" },
    credit: "IsaaK Alexandre KaRslian / Pexels",
    featuredByAgency: true,
  },
  {
    slug: "yerevan",
    name: "Yerevan",
    region: "Capital",
    summary: "Pink-stone streets, cafés, the Cascade and views of Mount Ararat.",
    image: {
      src: "/images/destinations/yerevan-cascade.jpg",
      alt: "Aerial view of central Yerevan at sunset",
    },
    backdrop: {
      image: "/media/places/yerevan-poster.jpg",
      video: {
        sources: [
          { src: "/media/places/yerevan-1600.mp4", media: "(min-width: 768px)" },
          { src: "/media/places/yerevan-960.mp4" },
        ],
      },
    },
    credit: "IsaaK Alexandre KaRslian / Pexels",
    featuredByAgency: true,
  },
  {
    slug: "brides-rock",
    name: "Bride's Rock",
    region: "Halidzor, Syunik",
    summary: "A lesser-known rock formation with wide views over the Syunik mountains.",
    image: {
      src: "/images/destinations/brides-rock.jpg",
      alt: "Rock formation with a small stone shrine above a deep mountain valley",
    },
    backdrop: { image: "/images/destinations/backdrops/brides-rock.jpg" },
    credit: "RP Go Armenia",
    featuredByAgency: true,
  },
  {
    slug: "garni-temple",
    name: "Garni Temple",
    region: "Kotayk",
    summary: "A classical colonnaded temple on a ridge above the Azat river gorge.",
    image: {
      src: "/images/destinations/garni-temple.jpg",
      alt: "Aerial view of Garni Temple among rugged brown mountains",
    },
    backdrop: { image: "/images/destinations/backdrops/garni-temple.jpg" },
    credit: "Dusan Stupar / Pexels",
  },
  {
    slug: "geghard-monastery",
    name: "Geghard Monastery",
    region: "Kotayk",
    summary: "A monastery partly carved into the cliffs of the upper Azat valley.",
    image: {
      src: "/images/destinations/geghard-monastery.jpg",
      alt: "Geghard Monastery beneath rocky cliffs and green slopes",
    },
    backdrop: { image: "/images/destinations/backdrops/geghard-monastery.jpg" },
    credit: "Alexander Fadeev / Pexels",
  },
  {
    slug: "khor-virap",
    name: "Khor Virap",
    region: "Ararat",
    summary: "A monastery on the Ararat plain with one of the closest views of the mountain.",
    image: {
      src: "/images/destinations/khor-virap.jpg",
      alt: "Khor Virap Monastery with snow-capped Mount Ararat behind at sunset",
    },
    backdrop: { image: "/images/destinations/backdrops/khor-virap.jpg" },
    credit: "Dusan Stupar / Pexels",
  },
  {
    slug: "sevanavank",
    name: "Sevanavank",
    region: "Lake Sevan",
    summary: "Stone churches on a peninsula high above the blue water of Lake Sevan.",
    image: {
      src: "/images/destinations/sevanavank.jpg",
      alt: "Sevanavank church overlooking Lake Sevan",
    },
    backdrop: { image: "/images/destinations/backdrops/sevanavank.jpg" },
    credit: "Uğurcan Özmen / Pexels",
  },
  {
    slug: "noravank",
    name: "Noravank",
    region: "Vayots Dzor",
    summary: "A monastery framed by red rock cliffs in a narrow, winding gorge.",
    image: {
      src: "/images/destinations/noravank.jpg",
      alt: "Red rock cliffs and green valley around Noravank Monastery",
    },
    backdrop: { image: "/images/destinations/backdrops/noravank.jpg" },
    credit: "Alexander Fadeev / Pexels",
  },
];
