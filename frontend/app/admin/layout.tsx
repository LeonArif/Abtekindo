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
 * The CMS deliberately does not use the public site's Header and Footer: a
 * navigation aimed at customers is noise for an operator editing prices, and
 * the floating WhatsApp button would sit on top of form controls.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
