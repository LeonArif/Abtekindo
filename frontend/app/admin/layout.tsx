import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/admin/AuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: {
    default: "Panel Admin",
    template: "%s | Panel Admin",
  },
  // robots.txt asks crawlers not to fetch /admin, but that alone does not stop
  // a crawler that already knows the URL from listing it. noindex does.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Admin layout.
 *
 * The public Header, Footer, and FloatingWhatsApp button live in
 * `app/(situs)/layout.tsx`, not the root layout, so `app/admin/**` (a
 * sibling of the `(situs)` route group) never renders them: a navigation
 * aimed at customers is noise for an operator editing prices, and the
 * floating WhatsApp button would sit on top of form controls.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
