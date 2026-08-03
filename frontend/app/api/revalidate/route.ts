import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CACHE_TAGS } from "@/lib/api/server";

/**
 * Cache invalidation webhook, called by the Go API after an admin write.
 *
 * This is what lets the public site serve at static speed while still being
 * database-backed: pages render from cache until an edit lands, at which point
 * the affected tag is marked stale and the next visitor triggers a refresh.
 */

/** Only tags the site actually uses may be invalidated. */
const ALLOWED_TAGS = new Set<string>(Object.values(CACHE_TAGS));

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    // Refusing rather than defaulting to open: a deployment missing the secret
    // must not expose an unauthenticated cache-purge endpoint.
    console.error("[revalidate] REVALIDATE_SECRET is not set, rejecting request");
    return NextResponse.json(
      { error: "revalidation is not configured" },
      { status: 500 },
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let tags: string[];
  try {
    const body = (await request.json()) as { tags?: unknown };
    tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const accepted = tags.filter((tag) => ALLOWED_TAGS.has(tag));
  const rejected = tags.filter((tag) => !ALLOWED_TAGS.has(tag));

  for (const tag of accepted) {
    // Next 16 requires the second cache-life argument; the single-argument form
    // is deprecated and is a TypeScript error. "max" gives
    // stale-while-revalidate semantics, so a visitor mid-request is served the
    // cached page rather than made to wait for a fresh render.
    revalidateTag(tag, "max");
  }

  if (rejected.length > 0) {
    console.warn("[revalidate] ignored unknown tags:", rejected);
  }

  return NextResponse.json({
    revalidated: accepted,
    ignored: rejected,
    now: Date.now(),
  });
}
