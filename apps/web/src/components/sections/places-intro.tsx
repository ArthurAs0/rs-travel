"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { placesIntro } from "@/lib/content/home";
import { destinations, type Destination } from "@/lib/mock-data/destinations";
import { cn } from "@/lib/utils";

const slides: CoverflowSlide[] = destinations.map((place) => ({
  src: place.image.src,
  alt: place.image.alt,
  title: place.name,
  subtitle: place.region,
  description: place.summary,
}));

const count = destinations.length;
const isNeighbour = (index: number, active: number) =>
  index === (active + 1) % count || index === (active - 1 + count) % count;

/**
 * "Places to explore": coverflow of destinations. The background follows the centred
 * card, cross-fading to that place's own footage (when we have it) or its photo with a
 * slow zoom.
 */
export function PlacesIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const sectionSeen = useInView(sectionRef, { once: true });
  const inView = useInView(sectionRef, { amount: 0.15 });

  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [pausedByVisitor, setPausedByVisitor] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stable, because the carousel calls it from an effect.
  const handleSelect = useCallback((index: number) => {
    setActive(index);
    setVisited((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  const activeHasVideo = Boolean(destinations[active].backdrop.video);
  const canPlay = sectionSeen && inView && prefersReducedMotion === false && !pausedByVisitor;

  return (
    <section
      ref={sectionRef}
      id="places"
      aria-labelledby="places-title"
      className="relative isolate scroll-mt-24 overflow-hidden bg-ocean-950 pt-24 pb-28 text-cloud sm:pt-32 lg:pb-36"
    >
      {/* Backdrop: one layer per destination; only the centred one is visible */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {destinations.map((place, index) => {
          const isActive = index === active;
          // Fetch the active layer, ones already seen, and the two neighbours (so the
          // next swipe is instant), but nothing before the section is reached.
          const shouldLoad =
            sectionSeen && (isActive || visited.has(index) || isNeighbour(index, active));
          return (
            <div
              key={place.slug}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-out",
                isActive ? "opacity-100" : "opacity-0",
              )}
            >
              {place.backdrop.video ? (
                <BackdropVideo
                  place={place}
                  load={shouldLoad}
                  playing={isActive && canPlay}
                  onPlayingChange={isActive ? setIsPlaying : undefined}
                />
              ) : (
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1.04 }}
                  // Slow push-in while centred; reset only after the fade-out has finished.
                  animate={{ scale: isActive ? 1.14 : 1.04 }}
                  transition={
                    isActive ? { duration: 18, ease: "linear" } : { duration: 0, delay: 1.1 }
                  }
                >
                  {shouldLoad && (
                    <Image
                      src={place.backdrop.image}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover blur-[2px]"
                    />
                  )}
                </motion.div>
              )}
            </div>
          );
        })}

        {/* Tint for legibility; a soft fade at the top joins it to the hero */}
        <div className="absolute inset-0 bg-ocean-950/55" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ocean-950 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,35,44,0.6)_100%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal
          as="header"
          className="grid gap-6 border-b border-white/15 pb-10 md:grid-cols-[1fr_minmax(0,26rem)] md:items-end md:gap-12"
        >
          <div>
            <p className="eyebrow text-ocean-200!">{placesIntro.eyebrow}</p>
            <h2
              id="places-title"
              className="mt-4 font-display text-[clamp(2.25rem,1.6rem+2.6vw,4rem)] leading-[1.04] font-semibold tracking-[-0.03em] text-cloud"
            >
              Places to <span className="text-ocean-300">explore</span>
            </h2>
          </div>
          <p className="text-base leading-relaxed text-cloud/80 sm:text-lg">{placesIntro.copy}</p>
        </Reveal>
      </div>

      <Reveal className="mt-6 sm:mt-10" amount={0.2}>
        <CoverflowCarousel
          slides={slides}
          label="Places to explore in Armenia"
          tone="dark"
          onSelectedChange={handleSelect}
          cardWidth="clamp(210px, 26vw, 360px)"
          rotate={40}
          gap={0.06}
          showCaption
          showNavigation
          showPagination
          cardClassName="rounded-3xl shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        />
      </Reveal>

      {/* Pause control, shown while the centred place has footage */}
      {activeHasVideo && (
        <button
          type="button"
          onClick={() => setPausedByVisitor(isPlaying)}
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
          className="absolute right-4 bottom-5 inline-flex size-11 items-center justify-center rounded-full border border-white/30 bg-ocean-950/40 text-white backdrop-blur-md transition-colors hover:bg-ocean-950/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 sm:bottom-6"
        >
          {isPlaying ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-px" aria-hidden="true" />
          )}
        </button>
      )}
    </section>
  );
}

/** Looping, muted background footage for one destination. Fetched lazily. */
function BackdropVideo({
  place,
  load,
  playing,
  onPlayingChange,
}: {
  place: Destination;
  load: boolean;
  playing: boolean;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = place.backdrop.video;

  // Sources are added late, and browsers ignore late <source> children until load().
  useEffect(() => {
    if (load) videoRef.current?.load();
  }, [load]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !load) return;
    if (playing) {
      element.play().catch(() => {
        // Autoplay blocked: the poster stays and the button offers Play.
      });
    } else {
      element.pause();
    }
  }, [playing, load]);

  // Keep the button in sync when this layer becomes the active one.
  useEffect(() => {
    if (onPlayingChange && videoRef.current) onPlayingChange(!videoRef.current.paused);
  }, [onPlayingChange]);

  if (!video) return null;

  return (
    <video
      ref={videoRef}
      className="size-full object-cover"
      muted
      loop
      playsInline
      preload={load ? "auto" : "none"}
      poster={place.backdrop.image}
      tabIndex={-1}
      onPlaying={() => onPlayingChange?.(true)}
      onPause={() => onPlayingChange?.(false)}
    >
      {load &&
        video.sources.map((source) => (
          <source key={source.src} src={source.src} type="video/mp4" media={source.media} />
        ))}
    </video>
  );
}
