import type { Metadata } from "next";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: true },
};

/**
 * Handles URLs that match no route at all (e.g. a mistyped path).
 *
 * Next.js resolves an unmatched URL against the root `app/not-found.js`
 * only: nothing under `app/(situs)/` ever matched, so its layout never gets
 * a chance to run. That means this file has to render the public chrome
 * itself instead of relying on `app/(situs)/layout.tsx`.
 *
 * A `notFound()` call thrown from inside `app/(situs)/**` is a different
 * case, handled by `app/(situs)/not-found.tsx` (which does get the chrome
 * for free from its layout).
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="konten" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
