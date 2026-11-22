"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, site } from "@/lib/site";
import { NavTabs } from "@/components/layout/nav-tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Switch to the floating pill once most of the hero has scrolled away.
  const update = (y: number) => setCondensed(y > window.innerHeight * 0.7);
  useMotionValueEvent(scrollY, "change", update);

  // Pick the right state when the page loads already scrolled (refresh, anchor link).
  useEffect(() => {
    const frame = requestAnimationFrame(() => update(window.scrollY));
    return () => cancelAnimationFrame(frame);
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
          "mx-auto flex items-center justify-between gap-4 transition-[max-width,background-color,color,padding,box-shadow,margin,border-radius] duration-500 ease-(--ease-soft)",
          condensed
            ? "mt-1 max-w-full rounded-full bg-transparent px-3 py-2 text-ocean-800 sm:px-6 lg:px-10"
            : "max-w-full rounded-none bg-transparent px-3 py-3 text-white sm:px-6 sm:py-4 lg:px-10",
        )}
      >
        <a
          href="#top"
          className="group flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4"
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

        <div className="flex items-center gap-2">
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-300 sm:inline-flex",
              condensed
                ? "bg-ocean-800 text-cloud hover:bg-ocean-900"
                : "bg-ocean-800 text-white ring-1 ring-white/20 hover:bg-ocean-900",
            )}
          >
            Plan your trip
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
                condensed ? "hover:bg-ocean-50 hover:text-ocean-700" : "bg-white/15 backdrop-blur-sm hover:bg-white/25",
              )}
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] bg-cloud p-6 text-ocean-900">
              <SheetTitle className="font-display text-2xl font-semibold tracking-[-0.02em] text-ocean-700">
                RP Go Armenia
              </SheetTitle>
              <SheetDescription className="text-stone">{site.tagline}</SheetDescription>
              <nav aria-label="Mobile" className="mt-6">
                <ul className="flex flex-col divide-y divide-sand border-y border-sand">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block py-4 font-display text-2xl font-semibold tracking-[-0.02em] text-ocean-800"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-sun px-5 py-3.5 text-sm font-semibold whitespace-nowrap text-ocean-950 transition-colors hover:bg-sun-deep"
              >
                Plan your trip on Instagram
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
