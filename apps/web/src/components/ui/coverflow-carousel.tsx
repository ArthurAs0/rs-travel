"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  src: string;
  alt: string;
  title?: string;
  /** Short label shown above the title (e.g. the region). */
  subtitle?: string;
  /** One or two sentences under the title. */
  description?: string;
  meta?: { label: string; value: string }[];
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  /** Names the carousel for assistive tech. */
  label?: string;
  /** Caption, dots and arrows styled for a light or a dark background. */
  tone?: "light" | "dark";
  /** Called whenever the centred card changes. */
  onSelectedChange?: (index: number) => void;
  /**
   * Advance on its own. Pauses while hovered or focused, stops for good once the
   * visitor drags, clicks or uses the controls, and never runs with reduced motion.
   */
  autoplay?: boolean;
  /** Milliseconds between automatic steps. */
  autoplayInterval?: number;
  className?: string;
  cardClassName?: string;
}

/**
 * 3D coverflow carousel: drag, flick, arrow keys, click a side card, or use the
 * buttons/dots. Positions are painted straight to the DOM for smooth 60fps motion.
 */
export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(148px, 22vw, 260px)",
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  tone = "light",
  onSelectedChange,
  autoplay = false,
  autoplayInterval = 4500,
  className,
  cardClassName,
}: CoverflowCarouselProps) {
  const dark = tone === "dark";
  const count = slides.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed, so a keypress mid-flight isn't swallowed. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const reduceMotionRef = React.useRef(false);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    startX: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  /** Autoplay bookkeeping: temporary pauses vs. a deliberate stop. */
  const [hovered, setHovered] = React.useState(false);
  const [focusWithin, setFocusWithin] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);

  React.useEffect(() => {
    onSelectedChange?.(selected);
  }, [selected, onSelectedChange]);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduceMotionRef.current = query.matches;
      setPrefersReducedMotion(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring: looping with
      // no cloned nodes and no DOM shuffling.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Tilt and recession ease off as cards travel out, so the second card stays readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card jumps across the ring at half a turn out, so it must be invisible by then.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number, ease = 0.16) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      if (reduceMotionRef.current) {
        posRef.current = target;
        paint();
        rafRef.current = null;
        return;
      }

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.002) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // Exponential ease-out (no overshoot).
        posRef.current += remaining * ease;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number, ease?: number) => settle(clamp(Math.round(targetRef.current) + by), ease),
    [clamp, settle],
  );

  /** Wrap any deliberate interaction: the visitor has taken over, so autoplay stops. */
  const takeOver = React.useCallback(() => {
    if (autoplay) setStopped(true);
  }, [autoplay]);

  // Only cycle while the carousel is actually on screen.
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!autoplay || !frame) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [autoplay]);

  const autoplayRunning =
    autoplay && !stopped && !hovered && !focusWithin && onScreen && !prefersReducedMotion;

  React.useEffect(() => {
    if (!autoplayRunning) return;
    const id = window.setInterval(() => {
      if (document.hidden || dragRef.current) return;
      nudge(1, 0.055); // a slower, gentler glide than a click
    }, autoplayInterval);
    return () => window.clearInterval(id);
  }, [autoplayRunning, autoplayInterval, nudge]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    takeOver();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      startX: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    // Cards per second, for the throw.
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;

    // A tap (barely moved) on a side card brings that card to the centre. Hit-test the
    // cards' on-screen boxes ourselves: elementFromPoint misses cards pushed back in 3D.
    if (event.type === "pointerup" && Math.abs(event.clientX - drag.startX) < 6) {
      let hitIndex = -1;
      let hitZ = -Infinity;
      cardRefs.current.forEach((card, index) => {
        if (!card || Number(card.style.opacity) < 0.05) return;
        const box = card.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        const z = Number(card.style.zIndex) || 0;
        if (inside && z > hitZ) {
          hitIndex = index;
          hitZ = z;
        }
      });
      if (hitIndex !== -1) {
        goTo(hitIndex);
        return;
      }
    }

    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  // Card width drives pitch, depth and perspective, so it is the only thing worth measuring.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              takeOver();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              takeOver();
              nudge(1);
            }
          }}
          // Clip sideways only (off-screen cards), so drop shadows can fade out below the cards
          // instead of being cut in a hard line.
          className="cursor-grab overflow-x-clip py-10 outline-none ring-ocean-500 focus-visible:ring-2 active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: "var(--cf-card)",
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.src}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                data-coverflow-index={index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}${slide.title ? `: ${slide.title}` : ""}`}
                className={cn(
                  "absolute top-0 left-1/2 aspect-square overflow-hidden rounded-2xl bg-muted shadow-xl will-change-transform",
                  cardClassName,
                )}
                style={{ width: "var(--cf-card)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  loading={index < 3 || index > count - 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover select-none"
                />
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => {
                takeOver();
                nudge(-1);
              }}
              className="absolute top-1/2 left-3 z-[200] -translate-y-1/2 rounded-full border border-ocean-900/10 bg-cloud/90 p-3 text-ocean-800 shadow-md backdrop-blur transition hover:bg-sun hover:text-ocean-950 sm:left-6"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => {
                takeOver();
                nudge(1);
              }}
              className="absolute top-1/2 right-3 z-[200] -translate-y-1/2 rounded-full border border-ocean-900/10 bg-cloud/90 p-3 text-ocean-800 shadow-md backdrop-blur transition hover:bg-sun hover:text-ocean-950 sm:right-6"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {showCaption && active?.title && (
        <div
          key={selected}
          aria-live="polite"
          className="mx-auto flex max-w-md flex-col items-center px-6 text-center duration-300 animate-in fade-in"
        >
          {active.subtitle && (
            <p
              className={cn(
                "text-[0.72rem] font-semibold tracking-[0.22em] uppercase",
                dark ? "text-ocean-200" : "text-teal",
              )}
            >
              {active.subtitle}
            </p>
          )}
          <p
            className={cn(
              "mt-2 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl",
              dark ? "text-cloud" : "text-ocean-700",
            )}
          >
            {active.title}
          </p>
          {active.description && (
            <p
              className={cn(
                "mt-2 text-[0.95rem] leading-relaxed",
                dark ? "text-cloud/75" : "text-stone",
              )}
            >
              {active.description}
            </p>
          )}
          {active.meta && active.meta.length > 0 && (
            <dl className="mt-6 w-full max-w-[230px] text-[12px]">
              {active.meta.map((row) => (
                <div key={row.label} className="flex justify-between py-[5px]">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Go to slide ${index + 1}${slide.title ? `: ${slide.title}` : ""}`}
              aria-current={index === selected}
              onClick={() => {
                takeOver();
                goTo(index);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                dark ? "bg-cloud" : "bg-ocean-700",
                index === selected ? "w-6 opacity-100" : "w-2 opacity-25 hover:opacity-50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
