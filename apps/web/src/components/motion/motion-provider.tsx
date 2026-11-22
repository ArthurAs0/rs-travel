"use client";

import { MotionConfig } from "motion/react";

/**
 * Honors the visitor's reduced-motion setting site-wide: Motion drops transform
 * and layout animation and keeps opacity fades.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
