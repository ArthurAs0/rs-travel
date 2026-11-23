"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, site } from "@/lib/site";

/** Each menu link sits on its own photo of the country. Keyed by link href. */
const LINK_PHOTOS: Record<string, string> = {
  "#places": "/images/destinations/noravank.jpg",
  "#planning": "/images/destinations/yerevan-cascade.jpg",
  "#travel-styles": "/images/destinations/dilijan.jpg",
  "#stories": "/images/destinations/geghard-monastery.jpg",
  "#contact": "/images/destinations/sevanavank.jpg",
};

/**
 * Shared timing, CSS-only so Base UI can wait for it before unmounting:
 * the three colour panels sweep in from the right one after another, then the links
 * rise in one by one, then the footer fades up. Closing is quick and simultaneous.
 */
const EASE_MAIN = "ease-[cubic-bezier(0.65,0.01,0.05,0.99)]";
const PANEL_DELAYS = [0, 120, 240];
const LINKS_START = 420;
const LINK_STAGGER = 60;

/** "Menu" ⇄ "Close" label that rolls, with a plus that turns into a cross. */
function ToggleFace({ open }: { open: boolean }) {
  return (
    <>
      <span className="relative block h-5 overflow-hidden">
        <span
          className={cn(
            "flex flex-col transition-transform duration-500 motion-reduce:transition-none",
            EASE_MAIN,
            open && "-translate-y-1/2",
          )}
        >
          <span className="block h-5 leading-5">Menu</span>
          <span className="block h-5 leading-5">Close</span>
        </span>
      </span>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={cn(
          "size-3.5 transition-transform duration-500 motion-reduce:transition-none",
          EASE_MAIN,
          open && "rotate-[135deg]",
        )}
      >
        <path d="M7.33 16V0h1.34v16H7.33Z" fill="currentColor" />
        <path d="M16 8.67H0V7.33h16v1.34Z" fill="currentColor" />
      </svg>
    </>
  );
}

/**
 * Phone and tablet navigation: a full-height panel built on Base UI's Dialog, so focus
 * is trapped, Escape closes it, the page behind can't scroll, and focus returns to the
 * trigger.
 */
export function MobileMenu({ condensed }: { condensed: boolean }) {
  const [open, setOpen] = useState(false);
  /** Section to scroll to once the menu has finished closing (and the scroll lock is gone). */
  const pendingTarget = useRef<string | null>(null);

  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    pendingTarget.current = href;
    setOpen(false);
  };

  const afterChange = (isOpen: boolean) => {
    const href = pendingTarget.current;
    if (isOpen || !href) return;
    // Next frame: after Base UI has released the scroll lock and skipped its own
    // return-focus (finalFocus reads pendingTarget, so it is cleared only here).
    requestAnimationFrame(() => {
      pendingTarget.current = null;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;
      target.scrollIntoView();
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={afterChange}>
      <Dialog.Trigger
        className={cn(
          "inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition-colors lg:hidden",
          condensed
            ? "bg-ocean-50 text-ocean-800 hover:bg-ocean-100"
            : "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25",
        )}
      >
        <ToggleFace open={open} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-ocean-950/50 transition-opacity duration-500 data-ending-style:opacity-0 data-starting-style:opacity-0" />

        <Dialog.Popup
          // Moving focus to a link scrolls it; start on the Close button instead.
          initialFocus={false}
          finalFocus={() => pendingTarget.current === null}
          className="group/menu fixed inset-y-0 right-0 z-[60] flex w-full flex-col overflow-hidden text-cloud outline-none sm:max-w-md"
        >
          {/* Colour panels sweeping in, deep ocean last */}
          {["bg-sun", "bg-ocean-500", "bg-ocean-900"].map((colour, index) => (
            <div
              key={colour}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 transition-transform duration-[575ms] group-data-ending-style/menu:translate-x-full group-data-ending-style/menu:delay-0! group-data-starting-style/menu:translate-x-[101%] motion-reduce:transition-none",
                EASE_MAIN,
                colour,
              )}
              style={{ transitionDelay: `${PANEL_DELAYS[index]}ms` }}
            />
          ))}

          {/* Top row: title on the left, Close where the Menu trigger was */}
          <div className="relative flex items-center justify-between px-6 pt-[30px] sm:px-10 sm:pt-10">
            <Dialog.Title
              className="font-display text-lg font-semibold tracking-[-0.02em] text-cloud transition-opacity duration-500 group-data-ending-style/menu:opacity-0 group-data-ending-style/menu:delay-0! group-data-starting-style/menu:opacity-0"
              style={{ transitionDelay: `${LINKS_START - 120}ms` }}
            >
              {site.name}
            </Dialog.Title>
            <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
            <Dialog.Close className="inline-flex h-10 items-center gap-2.5 rounded-full bg-white/10 px-4 text-sm font-semibold text-cloud transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <ToggleFace open={open} />
            </Dialog.Close>
          </div>

          {/* Links, each on its own photo */}
          <nav aria-label="Mobile" className="relative flex-1 overflow-y-auto px-4 pt-8 pb-6 sm:px-8">
            <ul className="flex flex-col gap-2.5">
              {navItems.map((item, index) => (
                <li key={item.href} className="overflow-hidden rounded-2xl">
                  <a
                    href={item.href}
                    onClick={(event) => goTo(event, item.href)}
                    className={cn(
                      "group/link relative isolate flex h-[clamp(68px,11svh,96px)] items-center gap-4 overflow-hidden rounded-2xl px-5 outline-none",
                      "transition-[translate,rotate,opacity] duration-700 group-data-ending-style/menu:opacity-0 group-data-ending-style/menu:delay-0! group-data-ending-style/menu:duration-200 group-data-starting-style/menu:translate-y-[140%] group-data-starting-style/menu:rotate-[8deg] motion-reduce:transition-none",
                      "origin-bottom-left focus-visible:ring-2 focus-visible:ring-cloud focus-visible:ring-inset",
                      EASE_MAIN,
                    )}
                    style={{ transitionDelay: `${LINKS_START + index * LINK_STAGGER}ms` }}
                  >
                    {LINK_PHOTOS[item.href] && (
                      <Image
                        src={LINK_PHOTOS[item.href]}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 416px, 100vw"
                        className="-z-10 object-cover opacity-75 transition-[opacity,scale] duration-700 ease-out group-hover/link:scale-[1.06] group-hover/link:opacity-90 group-focus-visible/link:opacity-90 group-active/link:opacity-90 motion-reduce:transition-none"
                      />
                    )}
                    {/* Keeps the label readable over any photo */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,55,68,0.88)_0%,rgba(0,55,68,0.45)_55%,rgba(0,55,68,0.05)_100%)]"
                    />
                    <span aria-hidden="true" className="text-xs font-semibold tabular-nums text-sun">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[clamp(1.75rem,1.2rem+2.4vw,2.25rem)] leading-none font-semibold tracking-[-0.03em]">
                      {item.label}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-auto size-5 shrink-0 text-cloud/70 transition-transform duration-300 group-hover/link:translate-x-1 group-hover/link:text-cloud"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer: tagline and the Instagram call to action */}
          <div
            className="relative px-6 pb-8 transition-[opacity,translate] duration-700 group-data-ending-style/menu:opacity-0 group-data-ending-style/menu:delay-0! group-data-ending-style/menu:duration-200 group-data-starting-style/menu:translate-y-4 group-data-starting-style/menu:opacity-0 motion-reduce:transition-none sm:px-10 sm:pb-10"
            style={{ transitionDelay: `${LINKS_START + navItems.length * LINK_STAGGER + 80}ms` }}
          >
            <p className="mb-4 text-sm text-cloud/70">{site.tagline}</p>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sun px-5 py-4 text-sm font-semibold whitespace-nowrap text-ocean-950 transition-colors hover:bg-sun-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Plan your trip on Instagram
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
