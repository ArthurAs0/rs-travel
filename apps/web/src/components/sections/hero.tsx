"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  type MotionValue,
  type Variants,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowDown } from "lucide-react";
import { ParallaxLayer, ParallaxScene } from "@/components/motion/parallax-scene";
import { araratScene, hero } from "@/lib/content/home";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Curtain hero. The section is taller than the screen and its stage is sticky, so
 * native scrolling drives it:
 *
 *   load         the Ararat parallax scene fills the screen, "ARMENIA" behind the peaks
 *   0 → 0.5      the scene lifts away like a curtain (its plates at different speeds,
 *                the foreground first) and uncovers the Ararat clip from the bottom up
 *   0.42 → 0.68  the headline lines and the link rise in over the clip
 *   0.68 → 1     short hold, then the page scrolls on to the destinations
 *
 * With reduced motion the section is one screen tall and shows the end state, the
 * clip paused on its matching still frame.
 */
const LIFT_END = 0.5;
/** Start of each headline line and of the link (each rises over REVEAL_SPAN). */
const REVEAL_AT = [0.42, 0.47, 0.52] as const;
const REVEAL_SPAN = 0.16;

// Plates are wider than the screen in portrait (cropped around the focal point).
const PLATE_SIZES = "(orientation: portrait) 330vw, 100vw";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** For `useSyncExternalStore` as a "has hydrated" flag: nothing to subscribe to. */
const subscribeNothing = () => () => {};

/** Phones and small tablets: the curtain lifts as one flat layer (see ParallaxScene `still`). */
const SMALL_SCREEN = "(max-width: 1023px)";
const subscribeSmallScreen = (onChange: () => void) => {
  const query = window.matchMedia(SMALL_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Load-in for the opening scene's copy: rises out of a blur; `custom` is its delay in seconds. */
const RISE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, delay, ease: EASE },
  }),
};

/** Furthest the footage drifts toward the cursor, in px. */
const DRIFT = 18;

/**
 * Footage drifts gently after the cursor. Mouse/trackpad only (`pointer: fine`), never
 * with reduced motion, and it only reacts to pointer moves (no idle animation loop).
 */
function useCursorDrift(enabled: boolean) {
  const x = useSpring(0, { stiffness: 60, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 60, damping: 18, mass: 0.6 });
  // Slight overscan while drifting so the frame's edges never show.
  const scale = useMotionValue(1);

  useEffect(() => {
    if (!enabled || !window.matchMedia("(pointer: fine)").matches) return;
    scale.set(1.04);
    const onMove = (event: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      x.set(((event.clientX - cx) / cx) * DRIFT);
      y.set(((event.clientY - cy) / cy) * DRIFT);
    };
    const recentre = () => {
      x.set(0);
      y.set(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", recentre);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", recentre);
      recentre();
      scale.set(1);
    };
  }, [enabled, x, y, scale]);

  return { x, y, scale };
}

/**
 * Scroll-linked rise: 0 → 1 as scroll passes `start` (over REVEAL_SPAN), always 1 with
 * motion off. Returns the value and a matching fade / lift style. Opacity and transform
 * only: an animated blur would repaint the huge headline on every scroll frame.
 */
function useRise(progress: MotionValue<number>, motionOn: MotionValue<number>, start: number) {
  const value = useTransform(
    () => 1 - (1 - clamp01((progress.get() - start) / REVEAL_SPAN)) * motionOn.get(),
  );
  const y = useTransform(value, (v) => 32 * (1 - v));
  return { value, style: { opacity: value, y } };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // The server always renders the full-motion layout; switch to the reduced layout only
  // after hydration so the first client render matches the server HTML.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const reduce = hydrated && Boolean(prefersReducedMotion);
  const smallScreen = useSyncExternalStore(
    subscribeSmallScreen,
    () => window.matchMedia(SMALL_SCREEN).matches,
    () => false,
  );

  const [videoVisible, setVideoVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const inView = useInView(stageRef, { amount: 0.1 });
  /** True once any of the clip is uncovered; until then decoding it is wasted work. */
  const [uncovered, setUncovered] = useState(false);
  const cursor = useCursorDrift(!reduce);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // 1 = scroll effects on, 0 = reduced motion (everything rests at the end state).
  const motionOn = useMotionValue(1);
  useEffect(() => {
    motionOn.set(reduce ? 0 : 1);
  }, [reduce, motionOn]);

  /** 0 → 1 as the scene lifts away; 1 under reduced motion. */
  const lift = useTransform(
    () => 1 - (1 - clamp01(scrollYProgress.get() / LIFT_END)) * motionOn.get(),
  );
  const curtainY = useTransform(() => `${-100 * lift.get()}%`);
  // Once fully lifted the curtain is off screen: stop compositing its big photo layers.
  const curtainVisibility = useTransform(() => (lift.get() >= 0.999 ? "hidden" : "visible"));
  // Plates start at their mid-scroll offsets (the composition that frames "ARMENIA"
  // behind the peaks) and keep sinking as the curtain lifts.
  const plateProgress = useTransform(() => 0.5 + 0.5 * lift.get());
  const videoScale = useTransform(() => 1.12 - 0.12 * lift.get());
  useMotionValueEvent(lift, "change", (value) => setUncovered(value > 0.01));
  const hintOpacity = useTransform(() => 1 - clamp01(scrollYProgress.get() / 0.1));

  const line1 = useRise(scrollYProgress, motionOn, REVEAL_AT[0]);
  const line2 = useRise(scrollYProgress, motionOn, REVEAL_AT[1]);
  const link = useRise(scrollYProgress, motionOn, REVEAL_AT[2]);
  const linkPointer = useTransform(() => (link.value.get() > 0.5 ? "auto" : "none"));

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch {
      // Autoplay was blocked: the matching still frame stays visible.
    }
  }, []);

  // Autoplay only when motion is welcome and the hero is on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed || prefersReducedMotion === null) return;
    if (prefersReducedMotion || !inView || !uncovered) {
      video.pause();
    } else {
      void play();
    }
  }, [prefersReducedMotion, inView, uncovered, videoFailed, play]);

  // Keyboard users tabbing to the still-hidden link: jump to where it is shown.
  const revealForFocus = () => {
    const section = sectionRef.current;
    if (!section || link.value.get() > 0.99) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + travel * (REVEAL_AT[2] + REVEAL_SPAN + 0.02),
      behavior: "instant",
    });
  };

  const { plates } = araratScene;
  const focusVars = {
    "--focus-desktop": hero.video.focus.desktop,
    "--focus-mobile": hero.video.focus.mobile,
  } as React.CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Introduction"
      className={cn("relative bg-ocean-950", reduce ? "h-svh min-h-[600px]" : "h-[260svh]")}
    >
      <div ref={stageRef} className="sticky top-0 isolate h-svh min-h-[600px] overflow-hidden">
        {/* The clip, waiting under the curtain */}
        <motion.div className="absolute inset-0" style={cursor}>
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{ ...focusVars, scale: videoScale }}
          >
            <Image
              src={hero.video.poster}
              alt={hero.video.posterAlt}
              fill
              sizes="100vw"
              className="object-cover object-(--focus-mobile) sm:object-(--focus-desktop)"
            />
            {!videoFailed && (
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 size-full object-cover object-(--focus-mobile) transition-opacity duration-1000 sm:object-(--focus-desktop)",
                  videoVisible ? "opacity-100" : "opacity-0",
                )}
                muted
                loop
                playsInline
                preload="auto"
                poster={hero.video.poster}
                aria-hidden="true"
                tabIndex={-1}
                onPlaying={() => setVideoVisible(true)}
                onError={() => setVideoFailed(true)}
              >
                {hero.video.sources.map((source) => (
                  <source key={source.src} src={source.src} type={source.type} media={source.media} />
                ))}
              </video>
            )}
          </motion.div>
        </motion.div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,35,44,0.6)_0%,rgba(0,35,44,0.25)_30%,rgba(0,35,44,0.25)_60%,rgba(0,35,44,0.7)_100%)]"
        />

        {/* Headline and link over the clip, rising in once the curtain is up */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-warm-white sm:px-8">
          <h1 className="font-display text-[clamp(2.375rem,1.55rem+3.6vw,5.5rem)] leading-[1.04] font-semibold tracking-[-0.03em] [text-shadow:0_2px_24px_rgba(0,35,44,0.35)]">
            <span className="sr-only">{hero.headline.join(" ")}</span>
            <motion.span aria-hidden="true" className="block whitespace-nowrap will-change-transform" style={line1.style}>
              {hero.headline[0]}
            </motion.span>
            <motion.span
              aria-hidden="true"
              className="block whitespace-nowrap text-warm-white/70 will-change-transform"
              style={line2.style}
            >
              {hero.headline[1]}
            </motion.span>
          </h1>
          <motion.div
            className="mt-6 will-change-transform sm:mt-8"
            style={{ ...link.style, pointerEvents: linkPointer }}
            onFocusCapture={revealForFocus}
          >
            <a
              href="#places"
              className="group inline-flex items-center gap-2.5 rounded-sm text-base font-medium whitespace-nowrap sm:text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="border-b border-white/45 pb-1 transition-colors duration-300 group-hover:border-white">
                {hero.exploreCta}
              </span>
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </motion.div>
        </div>

        {/* Curtain: the Ararat scene, lifting away with scroll */}
        <motion.div
          className="absolute inset-0 z-10 bg-ocean-950 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)] will-change-transform"
          style={{ y: curtainY, visibility: curtainVisibility }}
          aria-hidden={reduce || undefined}
        >
          <ParallaxScene
            aspect={araratScene.aspect}
            focus={{ x: 0.6, y: 0.5 }}
            headroom={0.3}
            progress={plateProgress}
            still={smallScreen}
            className="h-full"
          >
            {/* The sky plate is the full photo, so it carries the description */}
            <ParallaxLayer depth={0.34}>
              <Image src={plates.sky} alt={araratScene.alt} fill preload sizes={PLATE_SIZES} />
              {/* Deepen the upper sky so the light wordmark reads against it */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,35,44,0.85)_0%,rgba(0,35,44,0.55)_22%,rgba(0,35,44,0.18)_40%,transparent_50%)]" />
            </ParallaxLayer>

            {/* Wordmark between sky and mountains, so the peaks rise in front of it */}
            <ParallaxLayer depth={0.24} fit="row">
              <motion.div
                aria-hidden="true"
                initial="hidden"
                animate="visible"
                custom={0.2}
                variants={RISE_VARIANTS}
                className="absolute inset-x-0 top-[29%] text-center font-display leading-none font-semibold tracking-[-0.04em] text-warm-white uppercase sm:top-[25%]"
                style={{ fontSize: "min(calc(var(--plx-w) * 0.15), 19vw)" }}
              >
                {araratScene.title}
              </motion.div>
            </ParallaxLayer>

            <ParallaxLayer depth={0.1}>
              <Image src={plates.mountains} alt="" fill preload sizes={PLATE_SIZES} />
            </ParallaxLayer>

            <ParallaxLayer depth={0}>
              <Image src={plates.foreground} alt="" fill preload sizes={PLATE_SIZES} />
            </ParallaxLayer>
          </ParallaxScene>

          {/* Navbar veil on top, caption shade at the foot */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ocean-950/80 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-ocean-950/90 via-ocean-950/50 to-transparent"
          />

          {/* Caption and scroll hint */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="absolute inset-x-0 bottom-0 pb-12 text-warm-white sm:pb-16"
          >
            <div className="mx-auto flex max-w-6xl items-end justify-between gap-8 px-5 sm:px-8">
              <motion.div custom={0.5} variants={RISE_VARIANTS}>
                <p className="eyebrow text-ocean-200!">{araratScene.place}</p>
                <p className="mt-3 max-w-md text-base leading-relaxed text-cloud/85 sm:text-lg">
                  {araratScene.copy}
                </p>
              </motion.div>
              <motion.div style={{ opacity: hintOpacity }} className="hidden shrink-0 sm:block">
                <motion.p
                  custom={0.8}
                  variants={RISE_VARIANTS}
                  className="flex flex-col items-center gap-2 text-xs font-medium tracking-[0.2em] text-warm-white/80 uppercase"
                >
                  {hero.scrollHint}
                  <ArrowDown className="size-4 animate-bounce" aria-hidden="true" />
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
