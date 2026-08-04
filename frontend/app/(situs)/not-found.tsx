import type { Metadata } from "next";

import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: true },
};

/**
 * Handles `notFound()` thrown from within the `(situs)` route group (e.g.
 * `produk/[slug]/page.tsx` for a product that does not exist). Wrapped by
 * `app/(situs)/layout.tsx`, which supplies Header/Footer/FloatingWhatsApp.
 *
 * This does NOT catch URLs that match no route at all — see
 * `app/not-found.tsx` for that case.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
