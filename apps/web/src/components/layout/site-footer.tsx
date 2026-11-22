import Image from "next/image";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { Reveal } from "@/components/motion/reveal";
import { navItems, site } from "@/lib/site";

/**
 * Dark footer. Contact goes through Instagram DM only: the agency publishes no phone,
 * email or address, so none is shown.
 */
export function SiteFooter() {
  return (
    // Holds the #contact anchor until the Stage 4 contact section takes it over.
    <footer id="contact" className="relative overflow-hidden bg-ocean-950 text-cloud">
      {/* Soft teal glow so the dark block doesn't feel flat */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-teal/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
        <Reveal className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand + primary action */}
          <div className="lg:col-span-5">
            <span className="block size-14 overflow-hidden rounded-full bg-white ring-1 ring-white/20">
              <Image
                src={site.logo}
                alt={site.name}
                width={112}
                height={112}
                className="size-full scale-[1.06] object-cover"
              />
            </span>
            <p className="mt-6 font-display text-3xl leading-tight font-semibold tracking-[-0.02em] sm:text-4xl">
              {site.tagline}
            </p>
            <p className="mt-4 max-w-sm leading-relaxed text-cloud/70">{site.description}</p>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 text-sm font-semibold text-ocean-950 transition-colors hover:bg-sun-deep"
            >
              Plan your trip
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(opens Instagram in a new tab)</span>
            </a>
          </div>

          {/* Site links */}
          <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-7">
            <h2 className="text-xs font-semibold tracking-[0.22em] text-ocean-300 uppercase">
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-cloud/80 transition-colors hover:text-sun"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* How to get in touch */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold tracking-[0.22em] text-ocean-300 uppercase">
              Get in touch
            </h2>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 font-medium text-cloud transition-colors hover:text-sun"
            >
              <InstagramIcon className="size-5" />
              {site.instagramHandle}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-cloud/65">
              Send a DM with your approximate dates, group size and the places you&apos;d like to
              visit.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-cloud/65">
              <span className="font-medium text-cloud/90">Travel agencies:</span> partnership
              enquiries are welcome by DM too.
            </p>
          </div>
        </Reveal>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 py-7 sm:mt-20 text-sm text-cloud/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 font-medium text-cloud/80 transition-colors hover:text-sun"
            >
              Back to top
              <ArrowUp className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
