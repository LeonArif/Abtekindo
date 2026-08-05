"use client";

import { usePathname } from "next/navigation";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

/**
 * Public site chrome, hidden on admin routes.
 *
 * The admin panel has its own header (logo, admin nav, sign out) built for a
 * CMS operator, not a site visitor. Layering the public nav, footer and
 * WhatsApp bubble on top of that read as two unrelated sites stacked together.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
