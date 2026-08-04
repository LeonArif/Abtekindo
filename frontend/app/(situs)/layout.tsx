import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";

/**
 * Layout for the public site route group.
 *
 * Everything under `app/(situs)/` (home, produk, layanan, tentang-kami,
 * kontak, and its own not-found) gets the public chrome. `app/admin/**`
 * is a sibling of this group, not a descendant, so it never renders any
 * of this.
 */
export default function SitusLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
