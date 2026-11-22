"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { hero } from "@/lib/content/home";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Reveal timeline (seconds): landscape 0 → eyebrow 0.55 → headline lines 0.7 / 0.95
 * → subtitle 1.3 → buttons 1.45. With reduced motion every state applies instantly,
 * and server and client markup stay identical.
 */
const HEADLINE_DELAYS = [0.7, 0.95] as const;

function itemVariants(reduce: boolean, delay: number): Variants {
  return {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: reduce ? { duration: 0 } : { duration: 0.9, delay, ease: EASE },
    },
  };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [pausedByVisitor, setPausedByVisitor] = useState(false);

  const inView = useInView(sectionRef, { amount: 0.1 });

  // Gentle zoom on the footage and a soft lift on the copy while scrolling away.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // 1 = scroll effects on, 0 = reduced motion (values stay at rest).
  const motionOn = useMotionValue(1);
  useEffect(() => {
    motionOn.set(prefersReducedMotion ? 0 : 1);
  }, [prefersReducedMotion, motionOn]);
  const mediaScale = useTransform(() => 1 + 0.14 * scrollYProgress.get() * motionOn.get());
  const contentY = useTransform(() => -90 * scrollYProgress.get() * motionOn.get());
  const contentOpacity = useTransform(
    () => 1 - Math.min(scrollYProgress.get() / 0.55, 1) * motionOn.get(),
  );
  const shadeOpacity = useTransform(() => 0.35 * scrollYProgress.get() * motionOn.get());

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch {
      // Autoplay was blocked: the still frame stays visible and the button offers Play.
    }
  }, []);

  // Autoplay only when motion is welcome, the visitor hasn't paused, and the hero is on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed || prefersReducedMotion === null) return;
    if (prefersReducedMotion || pausedByVisitor || !inView) {
      video.pause();
    } else {
      void play();
    }
  }, [prefersReducedMotion, pausedByVisitor, inView, videoFailed, play]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setPausedByVisitor(false);
      void play();
    } else {
      setPausedByVisitor(true);
      video.pause();
    }
  };

  const reduce = Boolean(prefersReducedMotion);

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Introduction"
      className="relative"
    >
      <div className="relative isolate h-svh min-h-[600px] overflow-hidden bg-ocean-950 sm:min-h-[640px]">
        {/* Landscape layer: scroll zoom (outer) + intro reveal (inner) */}
        <motion.div
          className="absolute inset-0 -z-10 will-change-transform"
          style={{ scale: mediaScale }}
        >
          <motion.div
            className="absolute inset-0"
            style={
              {
                "--focus-desktop": hero.video.focus.desktop,
                "--focus-mobile": hero.video.focus.mobile,
              } as React.CSSProperties
            }
            initial={{ opacity: 0, scale: 1.08, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={reduce ? { duration: 0 } : { duration: 1.8, ease: EASE }}
          >
            <Image
              src={hero.video.poster}
              alt={hero.video.posterAlt}
              fill
              preload
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
                onPlaying={() => {
                  setIsPlaying(true);
                  setVideoVisible(true);
                }}
                onPause={() => setIsPlaying(false)}
                onError={() => setVideoFailed(true)}
              >
                {hero.video.sources.map((source) => (
                  <source
                    key={source.src}
                    src={source.src}
                    type={source.type}
                    media={source.media}
                  />
                ))}
              </video>
            )}
          </motion.div>
        </motion.div>

        {/* Shading keeps white text readable over bright skies */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,35,44,0.55)_0%,rgba(0,35,44,0.12)_28%,rgba(0,35,44,0.18)_55%,rgba(0,35,44,0.68)_100%)]"
        />
        {/* Wide, soft pool of shade behind the copy (no per-letter shadow) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_52%,rgba(0,35,44,0.38)_0%,rgba(0,35,44,0.18)_45%,transparent_75%)]"
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-ocean-950"
          style={{ opacity: shadeOpacity }}
        />

        {/* Copy */}
        <motion.div
          className="flex h-full flex-col items-center justify-center px-4 pt-28 pb-20 text-center text-warm-white sm:px-8 sm:pt-32 sm:pb-24"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex max-w-5xl flex-col items-center"
          >
            <motion.p
              variants={itemVariants(reduce, 0.55)}
              className="mb-5 hidden rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-[0.2em] uppercase backdrop-blur-sm sm:block"
            >
              {hero.eyebrow}
            </motion.p>
            {/* Two fixed lines; ~38px on phones scaling to 88px on wide desktops */}
            <h1 className="font-display text-[clamp(2.375rem,1.55rem+3.6vw,5.5rem)] leading-[1.04] font-semibold tracking-[-0.03em] text-warm-white">
              <span className="sr-only">{hero.headline.join(" ")}</span>
              <span aria-hidden="true" className="block">
                {hero.headline.map((line, index) => (
                  <TextAnimate
                    key={line}
                    as="span"
                    by="character"
                    animation="blurInUp"
                    once
                    accessible={false}
                    delay={reduce ? 0 : HEADLINE_DELAYS[index]}
                    duration={reduce ? 0 : 0.45}
                    className="block whitespace-nowrap"
                  >
                    {line}
                  </TextAnimate>
                ))}
              </span>
            </h1>
            <motion.p
              variants={itemVariants(reduce, 1.3)}
              className="mt-5 max-w-md text-base leading-relaxed text-warm-white/85 sm:mt-6 sm:max-w-xl sm:text-lg"
            >
              {hero.copy}
            </motion.p>
            <motion.div
              variants={itemVariants(reduce, 1.45)}
              className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-sun px-7 py-4 text-sm font-semibold text-ocean-950 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-colors hover:bg-sun-deep"
              >
                {hero.primaryCta}
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
                <span className="sr-only">(opens Instagram in a new tab)</span>
              </a>
              <a
                href="#places"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {hero.secondaryCta}
                <ArrowDown
                  className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Video control */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 1.6, duration: 0.8 }}
          className="absolute right-4 bottom-5 flex items-center gap-3 sm:right-6 sm:bottom-6"
        >
          {!videoFailed && (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause background video" : "Play background video"}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/30 bg-ocean-950/30 text-white backdrop-blur-md transition-colors hover:bg-ocean-950/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isPlaying ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4 translate-x-px" aria-hidden="true" />
              )}
            </button>
          )}
        </motion.div>

      </div>
    </section>
  );
}
