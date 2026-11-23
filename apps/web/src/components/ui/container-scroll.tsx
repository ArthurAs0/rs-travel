"use client";

import * as React from "react";
import {
  type HTMLMotionProps,
  type MotionValue,
  type UseScrollOptions,
  type Variants,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Scroll-linked container: a tall wrapper (`ContainerScroll`) with a sticky stage
 * (`ContainerSticky`). Children read the wrapper's scroll progress from context:
 * `ContainerInset` opens a clip-path window, `HeroVideo` scales up inside it, and
 * `ContainerAnimated` blurs in and rises. Scrolling stays native.
 */

type ContainerScrollContextValue = { scrollYProgress: MotionValue<number> };

const ContainerScrollContext = React.createContext<ContainerScrollContextValue | undefined>(
  undefined,
);

/** Scroll progress (0 → 1) of the nearest `ContainerScroll`, for custom scroll-linked children. */
export function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error("useContainerScrollContext must be used within a ContainerScroll component");
  }
  return context;
}

const SPRING_TRANSITION_CONFIG = {
  type: "spring",
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
} as const;

const variants: Variants = {
  hidden: { filter: "blur(10px)", opacity: 0 },
  visible: { filter: "blur(0px)", opacity: 1 },
};

type ContainerScrollProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Which part of the scroll drives progress 0 → 1. */
  offset?: UseScrollOptions["offset"];
  /** Pin every child at its end state (progress 1), e.g. for reduced motion. */
  settled?: boolean;
};

export function ContainerScroll({
  children,
  className,
  offset = ["start center", "end end"],
  settled = false,
  ...props
}: ContainerScrollProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollRef, offset });
  const done = useMotionValue(1);

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress: settled ? done : scrollYProgress }}>
      <div ref={scrollRef} className={cn("relative min-h-svh w-full", className)} {...props}>
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
}

export function ContainerSticky({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sticky top-0 left-0 min-h-svh w-full", className)} {...props} />;
}

type ContainerAnimatedProps = HTMLMotionProps<"div"> & {
  inputRange?: number[];
  outputRange?: number[];
};

export function ContainerAnimated({
  className,
  transition,
  style,
  inputRange = [0.2, 0.8],
  outputRange = [80, 0],
  ...props
}: ContainerAnimatedProps) {
  const { scrollYProgress } = useContainerScrollContext();
  const y = useTransform(scrollYProgress, inputRange, outputRange);
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      style={{ y, ...style }}
      transition={{ ...SPRING_TRANSITION_CONFIG, ...transition }}
      {...props}
    />
  );
}

type ContainerInsetProps = HTMLMotionProps<"div"> & {
  /** Vertical inset in % of the box, from → to. */
  insetYRange?: [number, number];
  /** Horizontal inset in % of the box, from → to. */
  insetXRange?: [number, number];
  /** Corner radius in px, from → to. */
  roundednessRange?: [number, number];
};

export function ContainerInset({
  className,
  style,
  insetYRange = [45, 0],
  insetXRange = [45, 0],
  roundednessRange = [1000, 16],
  ...props
}: ContainerInsetProps) {
  const { scrollYProgress } = useContainerScrollContext();
  const insetY = useTransform(scrollYProgress, [0, 0.8], insetYRange);
  const insetX = useTransform(scrollYProgress, [0, 0.8], insetXRange);
  const roundedness = useTransform(scrollYProgress, [0, 1], roundednessRange);
  const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${roundedness}px)`;

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      style={{ clipPath, ...style }}
      {...props}
    />
  );
}

type HeroVideoProps = HTMLMotionProps<"video"> & {
  ref?: React.Ref<HTMLVideoElement>;
  /** Scale from → to as the inset opens. */
  scaleRange?: [number, number];
};

export function HeroVideo({ style, className, scaleRange = [0.7, 1], ...props }: HeroVideoProps) {
  const { scrollYProgress } = useContainerScrollContext();
  const scale = useTransform(scrollYProgress, [0, 0.8], scaleRange);

  return (
    <motion.video
      className={cn("relative size-full object-cover", className)}
      muted
      loop
      playsInline
      style={{ scale, ...style }}
      {...props}
    />
  );
}
