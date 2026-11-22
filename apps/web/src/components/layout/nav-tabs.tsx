"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/site";

type CursorState = { x: number; width: number; opacity: number };

/**
 * Pill navigation with a highlight that slides to the hovered (or keyboard-focused) tab.
 * `condensed` switches between the see-through hero style and the floating ivory bar.
 */
export function NavTabs({ items, condensed }: { items: NavItem[]; condensed: boolean }) {
  const [cursor, setCursor] = useState<CursorState>({ x: 0, width: 0, opacity: 0 });
  const [active, setActive] = useState<string | null>(null);

  const moveTo = (element: HTMLElement, href: string) => {
    setCursor({ x: element.offsetLeft, width: element.offsetWidth, opacity: 1 });
    setActive(href);
  };
  const hide = () => {
    setCursor((current) => ({ ...current, opacity: 0 }));
    setActive(null);
  };

  return (
    <ul
      onMouseLeave={hide}
      className={cn(
        "relative flex items-center rounded-full border p-1 transition-colors duration-500",
        condensed ? "border-ocean-900/10 bg-ocean-50/80" : "border-white/20 bg-white/10 backdrop-blur-md",
      )}
    >
      {items.map((item) => (
        <NavTab
          key={item.href}
          item={item}
          highlighted={active === item.href}
          condensed={condensed}
          onActivate={moveTo}
          onDeactivate={hide}
        />
      ))}

      <motion.li
        role="presentation"
        aria-hidden="true"
        initial={false}
        animate={cursor}
        transition={{ type: "spring", stiffness: 420, damping: 34, opacity: { duration: 0.15 } }}
        className={cn(
          "pointer-events-none absolute top-1 bottom-1 left-0 z-0 rounded-full",
          condensed ? "bg-ocean-700" : "bg-white",
        )}
      />
    </ul>
  );
}

function NavTab({
  item,
  highlighted,
  condensed,
  onActivate,
  onDeactivate,
}: {
  item: NavItem;
  highlighted: boolean;
  condensed: boolean;
  onActivate: (element: HTMLElement, href: string) => void;
  onDeactivate: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const activate = () => {
    if (ref.current) onActivate(ref.current, item.href);
  };

  return (
    <li ref={ref} className="relative z-10">
      <a
        href={item.href}
        onMouseEnter={activate}
        onFocus={activate}
        onBlur={onDeactivate}
        className={cn(
          "block rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 xl:px-5",
          condensed
            ? highlighted
              ? "text-cloud"
              : "text-ocean-800 focus-visible:ring-ocean-500"
            : highlighted
              ? "text-ocean-900"
              : "text-white/90 focus-visible:ring-white/70",
        )}
      >
        {item.label}
      </a>
    </li>
  );
}
