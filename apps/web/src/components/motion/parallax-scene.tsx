"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Layered scroll parallax. A photo is cut into stacked, equally sized plates (sky,
 * mountains, foreground…) that sink at different speeds while the scene scrolls past,
 * so nearer plates slide over farther ones. Content such as a title can sit between
 * plates.
 *
 * Each plate is a box with the photo's aspect ratio, sized and placed like
 * `object-fit: cover` around a focal point (CSS container units, no JS measuring), so
 * the cut-outs stay aligned at every screen size.
 *
 * Motion only goes one way: farther layers sink more than nearer ones, so a front
 * plate's edge only ever covers more of what's behind it. Nothing hidden behind a
 * cut-out is ever uncovered, so plates need no painted-in background. What a sinking
 * plate does uncover is above its top edge: the stage extends above the section by
 * `headroom` for that, so the topmost plate needs a little extra sky.
 */

type SceneContextValue = {
  progress: MotionValue<number>;
  motionOn: MotionValue<number>;
};

const SceneContext = createContext<SceneContextValue | null>(null);

type ParallaxSceneProps = {
  /** Width / height of the plates (all plates share one size). */
  aspect: number;
  /** Point of the photo (0–1 in each axis) kept in view when it is cropped. */
  focus?: { x: number; y: number };
  /** How far the stage reaches above the section, as a fraction of the section's height. */
  headroom?: number;
  /**
   * Drive the layers from this 0 → 1 value instead of the scene's own scroll position,
   * e.g. when the scene sits on a pinned stage that moves by other means.
   */
  progress?: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
};

export function ParallaxScene({
  aspect,
  focus = { x: 0.5, y: 0.5 },
  headroom = 0.3,
  progress,
  className,
  children,
}: ParallaxSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // 0 when the scene's top enters the bottom of the screen, 1 when its bottom leaves the top.
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });
  const motionOn = useMotionValue(1);
  useEffect(() => {
    motionOn.set(prefersReducedMotion ? 0 : 1);
  }, [prefersReducedMotion, motionOn]);

  // Plate width covers the stage (like object-fit: cover); left/top keep the focal point
  // centred without ever exposing a plate's edge.
  const width = `max(100cqw, ${aspect * 100}cqh)`;
  const stageVars = {
    "--plx-aspect": `${aspect}`,
    "--plx-w": width,
    "--plx-h": `calc(var(--plx-w) / ${aspect})`,
    "--plx-left": `clamp(100cqw - var(--plx-w), 50cqw - ${focus.x} * var(--plx-w), 0px)`,
    "--plx-top": `clamp(100cqh - var(--plx-h), 50cqh - ${focus.y} * var(--plx-h), 0px)`,
  } as React.CSSProperties;

  return (
    <div ref={sceneRef} className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-x-0 bottom-0 [container-type:size]"
        style={{ top: `${-headroom * 100}%`, ...stageVars }}
      >
        <SceneContext.Provider value={{ progress: progress ?? scrollYProgress, motionOn }}>
          {children}
        </SceneContext.Provider>
      </div>
    </div>
  );
}

type ParallaxLayerProps = {
  /**
   * How far the layer sinks over the whole scroll, as a fraction of the plate height.
   * Farther layers get larger values; the nearest layer usually 0.
   */
  depth: number;
  /**
   * "plate" (default) matches the photo box, for image cut-outs. "row" spans the screen
   * width but keeps the photo's vertical position, for content like a centred title.
   */
  fit?: "plate" | "row";
  className?: string;
  children: React.ReactNode;
};

export function ParallaxLayer({ depth, fit = "plate", className, children }: ParallaxLayerProps) {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error("ParallaxLayer must be used inside a ParallaxScene");
  const { progress, motionOn } = scene;

  // With reduced motion, layers rest at their mid-scroll offsets.
  const y = useTransform(() => {
    const p = motionOn.get() ? progress.get() : 0.5;
    return `${depth * 100 * p}%`;
  });

  return (
    <motion.div
      className={cn(
        "absolute top-(--plx-top) h-(--plx-h) will-change-transform",
        fit === "plate" ? "left-(--plx-left) w-(--plx-w)" : "inset-x-0",
        className,
      )}
      style={{ y }}
    >
      {children}
    </motion.div>
  );
}
