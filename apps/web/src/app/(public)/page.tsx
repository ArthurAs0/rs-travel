import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/sections/hero";
import { PlacesIntro } from "@/components/sections/places-intro";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <PlacesIntro />
      </main>
      <SiteFooter />
    </>
  );
}
