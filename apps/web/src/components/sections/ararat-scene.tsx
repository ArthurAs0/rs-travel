import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { ParallaxLayer, ParallaxScene } from "@/components/motion/parallax-scene";
import { araratScene } from "@/lib/content/home";

// Plates are wider than the screen in portrait (cropped around the focal point).
const PLATE_SIZES = "(orientation: portrait) 330vw, 100vw";

/**
 * A breather between sections: Ararat seen from Khor Virap, in depth. The title sits
 * between the sky and the mountains, so it sinks behind the peaks as you scroll.
 */
export function AraratScene() {
  const { plates } = araratScene;

  return (
    <section
      aria-labelledby="ararat-title"
      className="relative isolate overflow-hidden bg-ocean-950 text-warm-white"
    >
      <ParallaxScene
        aspect={araratScene.aspect}
        focus={{ x: 0.6, y: 0.5 }}
        headroom={0.3}
        className="h-[88svh] min-h-[560px] sm:h-svh sm:min-h-[680px]"
      >
        {/* The sky plate is the full photo, so it carries the description */}
        <ParallaxLayer depth={0.34}>
          <Image src={plates.sky} alt={araratScene.alt} fill sizes={PLATE_SIZES} />
          {/* Deepen the upper sky so the light title reads against it */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,35,44,0.85)_0%,rgba(0,35,44,0.55)_22%,rgba(0,35,44,0.18)_40%,transparent_50%)]" />
        </ParallaxLayer>

        <ParallaxLayer depth={0.24} fit="row">
          <h2
            id="ararat-title"
            className="absolute inset-x-0 top-[29%] text-center sm:top-[25%] font-display leading-none font-semibold tracking-[-0.04em] text-warm-white uppercase"
            style={{ fontSize: "min(calc(var(--plx-w) * 0.15), 19vw)" }}
          >
            {araratScene.title}
          </h2>
        </ParallaxLayer>

        <ParallaxLayer depth={0.1}>
          <Image src={plates.mountains} alt="" fill sizes={PLATE_SIZES} />
        </ParallaxLayer>

        <ParallaxLayer depth={0}>
          <Image src={plates.foreground} alt="" fill sizes={PLATE_SIZES} />
        </ParallaxLayer>
      </ParallaxScene>

      {/* Blend into the dark sections above and below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ocean-950 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ocean-950 via-ocean-950/70 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 pb-14 sm:pb-20">
        <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-ocean-200!">{araratScene.place}</p>
          <p className="mt-3 max-w-md text-base leading-relaxed text-cloud/85 sm:text-lg">
            {araratScene.copy}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
