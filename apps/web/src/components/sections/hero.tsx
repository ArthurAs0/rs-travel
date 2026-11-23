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
 *
 * Small screens (below `lg`) differ:
 *   - the stage is exactly 100svh (no 600px floor), so it never outgrows the viewport
 *     and releases before the curtain is up;
 *   - the section is 300svh, so the curtain lifts over one full stage height of scroll
 *     and moves 1:1 with the finger;
 *   - progress is measured against the pin's own travel (section − stage, both in svh)
 *     rather than the viewport, so the mobile toolbar showing or hiding mid-scroll
 *     doesn't shift it;
 *   - only the curtain's vertical position animates (no plate parallax, no clip zoom);
 *   - the clip's backdrop reaches 100lvh, so no strip of section background shows
 *     under the stage while the toolbar is collapsed.
 */
const LIFT_END = 0.5;
/** Start of each headline line and of the link (each rises over REVEAL_SPAN). */
const REVEAL_AT = [0.42, 0.47, 0.52] as const;
const REVEAL_SPAN = 0.16;

// The 1920px plates are cropped around the focal point. Keep mobile requests close
// to the source resolution instead of multiplying the 330vw layout width by DPR.
const PLATE_SIZES =
  "(max-width: 1023px) and (orientation: portrait) 150vw, (max-width: 1023px) 75vw, (orientation: portrait) 100vw, 100vw";

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
  const curtainRef = useRef<HTMLDivElement>(null);
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
  const supportsNativeScrollTimeline = useSyncExternalStore(
    subscribeNothing,
    () =>
      CSS.supports("animation-timeline: scroll(root block)") &&
      CSS.supports("animation-range: 0% 100%"),
    () => false,
  );
  const nativeMobileScroll = hydrated && smallScreen && supportsNativeScrollTimeline;
  const [nativeScrollRanges, setNativeScrollRanges] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!nativeMobileScroll) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const measure = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - document.documentElement.clientHeight,
        1,
      );
      const top = section.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(section.offsetHeight - stage.offsetHeight, 1);
      const range = (progress: number) => `${((top + travel * progress) / maxScroll) * 100}%`;
      setNativeScrollRanges({
        "--hero-lift-start": range(0),
        "--hero-lift-end": range(LIFT_END),
        "--hero-line-1-start": range(REVEAL_AT[0]),
        "--hero-line-1-end": range(REVEAL_AT[0] + REVEAL_SPAN),
        "--hero-line-2-start": range(REVEAL_AT[1]),
        "--hero-line-2-end": range(REVEAL_AT[1] + REVEAL_SPAN),
        "--hero-link-start": range(REVEAL_AT[2]),
        "--hero-link-end": range(REVEAL_AT[2] + REVEAL_SPAN),
      } as React.CSSProperties);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(stage);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [nativeMobileScroll]);

  const [videoVisible, setVideoVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  /** Pending `requestVideoFrameCallback` id while waiting for the clip's first frame. */
  const frameRequest = useRef<number | null>(null);

  const inView = useInView(stageRef, { amount: 0.1 });
  /**
   * True once the curtain has fully lifted. The clip starts only then, so starting and
   * decoding it never competes with the lift animation; until then its matching still
   * frame shows through.
   */
  const [curtainGone, setCurtainGone] = useState(false);
  const curtainWasGone = useRef(false);
  const nativeCurtainWasGone = useRef(false);
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
  // 1 = small-screen behaviour (see the component comment).
  const mobileOn = useMotionValue(0);
  useEffect(() => {
    mobileOn.set(smallScreen ? 1 : 0);
  }, [smallScreen, mobileOn]);

  // Small screens: progress over the pin's own travel. Both sizes are in svh, so they
  // only change on rotation or real resizes, not when the toolbar shows or hides.
  const { scrollY } = useScroll();
  const pinTop = useMotionValue(0);
  const pinTravel = useMotionValue(1);
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const measure = () => {
      pinTop.set(section.getBoundingClientRect().top + window.scrollY);
      pinTravel.set(Math.max(section.offsetHeight - stage.offsetHeight, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [pinTop, pinTravel]);

  /** 0 → 1 over the hero's scroll. Every source is read so all stay subscribed. */
  const progress = useTransform(() => {
    if (nativeMobileScroll) return 0;
    const pinned = clamp01((scrollY.get() - pinTop.get()) / pinTravel.get());
    const page = scrollYProgress.get();
    return mobileOn.get() ? pinned : page;
  });

  /** 0 → 1 as the scene lifts away; 1 under reduced motion. */
  const lift = useTransform(
    () => 1 - (1 - clamp01(progress.get() / LIFT_END)) * motionOn.get(),
  );
  const curtainY = useTransform(() => `${-100 * lift.get()}%`);
  // Once fully lifted the curtain is off screen: stop compositing its big photo layers.
  const curtainVisibility = useTransform(() => (lift.get() >= 0.999 ? "hidden" : "visible"));
  // Plates start at their mid-scroll offsets (the composition that frames "ARMENIA"
  // behind the peaks) and keep sinking as the curtain lifts.
  const plateProgress = useTransform(() => 0.5 + 0.5 * lift.get());
  // The clip eases out of a slight zoom as it is uncovered; held still on small screens.
  const videoScale = useTransform(() => {
    const zoom = 1.12 - 0.12 * lift.get();
    return mobileOn.get() ? 1 : zoom;
  });
  useMotionValueEvent(lift, "change", (value) => {
    if (nativeMobileScroll) return;
    const gone = value >= 0.999;
    if (gone === curtainWasGone.current) return;
    curtainWasGone.current = gone;
    setCurtainGone(gone);
    // On phones, returning to the curtain must restore its poster. Reset readiness
    // here so the next reveal waits for a fresh decoded frame before fading in.
    if (!gone && smallScreen) setVideoVisible(false);
  });

  // On supported phones, use the same measured scroll threshold as the CSS timeline
  // to start/pause the video. IntersectionObserver can miss a transformed sticky layer.
  useEffect(() => {
    if (!nativeMobileScroll) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    let top = 0;
    let travel = 1;
    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(section.offsetHeight - stage.offsetHeight, 1);
      update();
    };
    const update = () => {
      const progress = clamp01((window.scrollY - top) / travel);
      const gone = progress >= LIFT_END * 0.999;
      if (gone === nativeCurtainWasGone.current) return;
      nativeCurtainWasGone.current = gone;
      setCurtainGone(gone);
      if (!gone) setVideoVisible(false);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(stage);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, [nativeMobileScroll]);
  const hintOpacity = useTransform(() => 1 - clamp01(progress.get() / 0.1));

  const line1 = useRise(progress, motionOn, REVEAL_AT[0]);
  const line2 = useRise(progress, motionOn, REVEAL_AT[1]);
  const link = useRise(progress, motionOn, REVEAL_AT[2]);
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

  const cancelFrameRequest = useCallback(() => {
    const video = videoRef.current;
    if (video && frameRequest.current !== null) {
      video.cancelVideoFrameCallback(frameRequest.current);
    }
    frameRequest.current = null;
  }, []);

  // Autoplay only when motion is welcome and the hero is on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed || prefersReducedMotion === null) return;
    if (prefersReducedMotion || !inView || !curtainGone) {
      // Curtain back down before the first frame arrived: keep showing the poster.
      cancelFrameRequest();
      video.pause();
    } else {
      void play();
    }
  }, [prefersReducedMotion, inView, curtainGone, videoFailed, play, cancelFrameRequest]);

  // Fade the clip in over its poster only once a decoded frame is on screen, so the
  // fade never starts from a blank element. `playing` alone can fire before that.
  const onPlaying = () => {
    const video = videoRef.current;
    if (!video || videoVisible || frameRequest.current !== null) return;
    if (typeof video.requestVideoFrameCallback !== "function") {
      setVideoVisible(true);
      return;
    }
    frameRequest.current = video.requestVideoFrameCallback(() => {
      frameRequest.current = null;
      setVideoVisible(true);
    });
  };

  const showVideo = videoVisible && (!smallScreen || curtainGone);

  // Keyboard users tabbing to the still-hidden link: jump to where it is shown.
  const revealForFocus = () => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage || link.value.get() > 0.99) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - (smallScreen ? stage.offsetHeight : window.innerHeight);
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
      data-native-scroll={nativeMobileScroll ? "true" : undefined}
      style={nativeMobileScroll ? nativeScrollRanges : undefined}
      className={cn(
        // Small screens clip (not hide, which would break the sticky stage) the
        // backdrop's 100lvh overhang so it never paints over the next section.
        "relative bg-ocean-950 max-lg:overflow-clip",
        reduce ? "h-svh lg:min-h-[600px]" : "h-[300svh] lg:h-[260svh]",
      )}
    >
      <div
        ref={stageRef}
        className="sticky top-0 isolate h-svh lg:min-h-[600px] lg:overflow-hidden"
      >
        {/* The clip, waiting under the curtain. 100lvh tall on small screens, so it
            still fills the screen when the toolbar collapses below the 100svh stage. */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden max-lg:h-lvh">
          <motion.div className="absolute inset-0" style={cursor}>
            <motion.div
              className="absolute inset-0 lg:will-change-transform"
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
                    showVideo ? "opacity-100" : "opacity-0",
                  )}
                  style={{ transitionDuration: smallScreen && !showVideo ? "0ms" : undefined }}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={hero.video.poster}
                  aria-hidden="true"
                  tabIndex={-1}
                  onPlaying={onPlaying}
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
        </div>

        {/* Headline and link over the clip, rising in once the curtain is up */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-warm-white sm:px-8">
          <h1 className="font-display text-[clamp(2.375rem,1.55rem+3.6vw,5.5rem)] leading-[1.04] font-semibold tracking-[-0.03em] [text-shadow:0_2px_24px_rgba(0,35,44,0.35)]">
            <span className="sr-only">{hero.headline.join(" ")}</span>
            <motion.span
              aria-hidden="true"
              className="hero-mobile-reveal-1 block whitespace-nowrap will-change-transform"
              style={nativeMobileScroll ? undefined : line1.style}
            >
              {hero.headline[0]}
            </motion.span>
            <motion.span
              aria-hidden="true"
              className="hero-mobile-reveal-2 block whitespace-nowrap text-warm-white/70 will-change-transform"
              style={nativeMobileScroll ? undefined : line2.style}
            >
              {hero.headline[1]}
            </motion.span>
          </h1>
          <motion.div
            className="hero-mobile-reveal-link mt-6 will-change-transform sm:mt-8"
            style={nativeMobileScroll ? undefined : { ...link.style, pointerEvents: linkPointer }}
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
          ref={curtainRef}
          className="absolute inset-0 z-10 bg-ocean-950 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)] will-change-transform"
          data-hero-curtain=""
          style={nativeMobileScroll ? undefined : { y: curtainY, visibility: curtainVisibility }}
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
