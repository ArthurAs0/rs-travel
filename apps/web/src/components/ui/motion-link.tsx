import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MotionLinkProps = {
  label: string;
  href: string;
  /** Opens in a new tab and tells screen-reader users so. */
  external?: boolean;
  /** Read after the label by screen readers, e.g. "(opens Instagram in a new tab)". */
  srHint?: string;
  className?: string;
};

/**
 * Pill link with an arrow disc that fills the whole pill on hover or keyboard focus.
 * Deep ocean pill, Summer Sun disc; the label flips to dark ink as the disc passes under it.
 */
export function MotionLink({ label, href, external, srHint, className }: MotionLinkProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group relative block w-44 rounded-full bg-ocean-800 p-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="block h-10 w-10 rounded-full bg-sun transition-[width] duration-500 ease-(--ease-soft) group-hover:w-full group-focus-visible:w-full motion-reduce:transition-none"
      />
      <ArrowRight
        aria-hidden="true"
        className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ocean-950 transition-transform duration-500 ease-(--ease-soft) group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5 motion-reduce:transition-none"
      />
      <span className="absolute top-1/2 left-1/2 ml-5 -translate-x-1/2 -translate-y-1/2 text-[0.9375rem] font-semibold tracking-tight whitespace-nowrap text-cloud transition-colors duration-500 group-hover:text-ocean-950 group-focus-visible:text-ocean-950">
        {label}
        {srHint && <span className="sr-only"> {srHint}</span>}
      </span>
    </a>
  );
}
