import type { NextConfig } from "next";

// Product images are served from the CMS/Cloudflare R2 bucket (see
// backend/.env.example: R2_ACCOUNT_ID, R2_BUCKET, R2_PUBLIC_BASE_URL).
// next/image refuses to optimize any external hostname that isn't listed
// here, so both common R2 public-access origins are allowlisted below.
// If/when a custom domain is configured for R2_PUBLIC_BASE_URL, add it here
// too. NEXT_PUBLIC_R2_PUBLIC_HOSTNAME lets a specific deployment declare its
// exact R2 public hostname (e.g. a custom domain) without editing this file;
// it's optional and additive to the generic wildcards below.
const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Default R2.dev public bucket URLs, e.g. https://pub-<hash>.r2.dev/...
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      // S3-compatible R2 endpoint, e.g.
      // https://<account_id>.r2.cloudflarestorage.com/... (rarely used for
      // direct public access, but harmless to allow).
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      ...(r2PublicHostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2PublicHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
