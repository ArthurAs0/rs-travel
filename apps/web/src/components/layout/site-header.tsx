"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";
import { navItems, site } from "@/lib/site";
import { NavTabs } from "@/components/layout/nav-tabs";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { MotionLink } from "@/components/ui/motion-link";

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);

  // Switch to the floating pill once most of the hero has scrolled away. The threshold
  // is measured on load and resize only: reading layout on every scroll event would
  // force a reflow per frame.
  const threshold = useRef(0);
  const update = (y: number) => setCondensed(y > threshold.current);
  useMotionValueEvent(scrollY, "change", update);

  useEffect(() => {
    const measure = () => {
      const heroHeight = document.getElementById("top")?.offsetHeight ?? window.innerHeight;
      threshold.current = heroHeight - window.innerHeight * 0.3;
      setCondensed(window.scrollY > threshold.current);
    };
    // Also picks the right state when the page loads already scrolled (refresh, anchor link).
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <div
        className={cn(
          // Three columns with equal sides from lg, so the nav sits on the page's true centre
          // whatever the logo and button widths; logo | actions below lg (nav hidden).
          "mx-auto grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr] transition-[max-width,background-color,color,padding,box-shadow,margin,border-radius] duration-500 ease-(--ease-soft)",
          condensed
            ? "mt-1 max-w-full rounded-full bg-transparent px-3 py-2 text-ocean-800 sm:px-6 lg:px-10"
            : "max-w-full rounded-none bg-transparent px-3 py-3 text-white sm:px-6 sm:py-4 lg:px-10",
        )}
      >
        <a
          href="#top"
          className="group flex items-center justify-self-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={`${site.name}, back to top`}
        >
          <span
            className={cn(
              "relative block size-13 shrink-0 overflow-hidden rounded-full bg-white sm:size-14",
              condensed ? "shadow-[0_6px_20px_-8px_rgba(0,54,66,0.45)] ring-1 ring-ocean-900/10" : "ring-2 ring-white/50",
            )}
          >
            <Image
              src={site.logo}
              alt=""
              width={112}
              height={112}
              className="size-full scale-[1.06] object-cover"
            />
          </span>
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <NavTabs items={navItems} condensed={condensed} />
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <div className="hidden sm:block">
            <MotionLink
              label="Plan your trip"
              href={site.instagramUrl}
              external
              srHint="(opens Instagram in a new tab)"
              className={cn(
                "transition-shadow duration-500",
                condensed ? "shadow-[0_6px_20px_-8px_rgba(0,54,66,0.45)]" : "ring-1 ring-white/20",
              )}
            />
          </div>

          <MobileMenu condensed={condensed} />
        </div>
      </div>
    </motion.header>
  );
}
