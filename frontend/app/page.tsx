import type { Metadata } from "next";

import { getFeaturedProducts, getServices, safely } from "@/lib/api/server";
import { SITE } from "@/lib/site";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { Faq } from "@/components/home/Faq";
import { Reveal } from "@/components/ui/Reveal";
import {
  BrandStrip,
  CtaBand,
  FeaturedProducts,
  HowToOrder,
  PriceHighlights,
  ServiceHighlights,
} from "@/components/home/Sections";

export const metadata: Metadata = {
  // The layout template appends the brand, but the homepage sets its own full
  // title so the most important page in search reads as a complete sentence.
  title: {
    absolute: `${SITE.legalName} - Service, Pasang, dan Jual AC`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Fetched in parallel: the two calls are independent, so waiting for them in
  // sequence would double the page's time to first byte for no reason.
  //
  // Both are wrapped so an API outage degrades the homepage instead of breaking
  // it. The hero, contact details and WhatsApp button, which are what actually
  // generate business, keep working even with no catalog data.
  const [services, featured] = await Promise.all([
    safely(getServices(), [], "homepage services"),
    safely(getFeaturedProducts(8), [], "homepage featured products"),
  ]);

  return (
    <>
      <Hero />
      <Reveal delay={80}>
        <PriceHighlights products={featured} />
      </Reveal>
      <Reveal delay={160}>
        <ValueProps />
      </Reveal>
      <Reveal delay={240}>
        <ServiceHighlights services={services} />
      </Reveal>
      <Reveal delay={320}>
        <BrandStrip />
      </Reveal>
      <Reveal delay={400}>
        <FeaturedProducts products={featured} />
      </Reveal>
      <Reveal delay={480}>
        <HowToOrder />
      </Reveal>
      <Reveal delay={560}>
        <Faq />
      </Reveal>
      <Reveal delay={640}>
        <CtaBand />
      </Reveal>
    </>
  );
}
