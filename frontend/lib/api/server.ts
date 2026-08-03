import "server-only";

import type {
  Product,
  ProductList,
  Service,
  ServiceList,
  Sitemap,
} from "./types";

/**
 * Server-side reads from the Go API.
 *
 * Every response is cached and tagged. The API calls the frontend's
 * /api/revalidate webhook after an admin write, which expires the matching tag,
 * so public pages serve at static speed but reflect a CMS edit within seconds.
 *
 * The `revalidate` window is the fallback for a missed webhook, not the primary
 * freshness mechanism.
 */

/** Cache tags, matched by what the Go API sends to the revalidate webhook. */
export const CACHE_TAGS = {
  products: "products",
  services: "services",
} as const;

/** Fallback revalidation window, in seconds, if a webhook is ever missed. */
const FALLBACK_REVALIDATE = 3600;

function apiBaseUrl(): string {
  const url = process.env.API_URL ?? "http://localhost:8080";
  return url.replace(/\/$/, "");
}

/** Raised when the API responds with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly path: string,
  ) {
    super(`API ${status} on ${path}: ${detail}`);
    this.name = "ApiError";
  }
}

type GetOptions = {
  tags?: string[];
  revalidate?: number;
  /** Search params appended to the path. Undefined values are dropped. */
  query?: Record<string, string | number | undefined>;
};

async function apiGet<T>(path: string, options: GetOptions = {}): Promise<T> {
  const url = new URL(apiBaseUrl() + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    next: {
      tags: options.tags,
      revalidate: options.revalidate ?? FALLBACK_REVALIDATE,
    },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // A non-JSON error body is not worth failing over; the status is enough.
    }
    throw new ApiError(response.status, detail, path);
  }

  return (await response.json()) as T;
}

/** Catalog listing with optional facets. Arrays are sent comma-separated. */
export function getProducts(filters: {
  brand?: string[];
  type?: string[];
  pk?: number[];
  page?: number;
  pageSize?: number;
}): Promise<ProductList> {
  return apiGet<ProductList>("/v1/products", {
    tags: [CACHE_TAGS.products],
    query: {
      brand: filters.brand?.length ? filters.brand.join(",") : undefined,
      type: filters.type?.length ? filters.type.join(",") : undefined,
      pk: filters.pk?.length ? filters.pk.join(",") : undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });
}

/** A single product plus related suggestions. */
export function getProduct(
  slug: string,
): Promise<{ product: Product; related: Product[] }> {
  return apiGet<{ product: Product; related: Product[] }>(
    `/v1/products/${encodeURIComponent(slug)}`,
    { tags: [CACHE_TAGS.products] },
  );
}

/** Products flagged for the homepage. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const body = await apiGet<{ products: Product[] }>("/v1/products-featured", {
    tags: [CACHE_TAGS.products],
    query: { limit },
  });
  return body.products;
}

/** Published services with their rate tables. */
export async function getServices(): Promise<Service[]> {
  const body = await apiGet<ServiceList>("/v1/services", {
    tags: [CACHE_TAGS.services],
  });
  return body.services;
}

/** A single service. */
export function getService(slug: string): Promise<Service> {
  return apiGet<Service>(`/v1/services/${encodeURIComponent(slug)}`, {
    tags: [CACHE_TAGS.services],
  });
}

/** Every published slug, for sitemap and static path generation. */
export function getSitemapEntries(): Promise<Sitemap> {
  return apiGet<Sitemap>("/v1/sitemap", {
    tags: [CACHE_TAGS.products, CACHE_TAGS.services],
  });
}

/**
 * Wraps a read so a failing API degrades the page instead of breaking it.
 *
 * A homepage that renders without its featured-products strip is far better
 * than an error page: the phone number, services and WhatsApp button, which are
 * what actually generate business, all still work.
 */
export async function safely<T>(
  promise: Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[api] ${context} failed, rendering without it:`, error);
    return fallback;
  }
}
