"use client";

import type {
  AdminUser,
  Lead,
  LeadList,
  LeadStatus,
  Product,
  ProductList,
  ProductWrite,
  Service,
  ServiceList,
  ServiceWrite,
  UploadTarget,
} from "./types";

/**
 * Browser-side client for the admin CMS.
 *
 * Every call sends `credentials: "include"` so the session cookies travel with
 * it. The frontend and API share a registrable domain in both environments
 * (localhost, then abtekindo.com and api.abtekindo.com), so the SameSite=Lax
 * cookies are considered same-site and are sent.
 *
 * The admin talks to the Go API directly rather than proxying through Next
 * route handlers, which keeps authorisation in exactly one place.
 */

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return base.replace(/\/$/, "") + path;
}

/** Error carrying the API's status and Indonesian message. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }

  /** True when the session is missing or expired. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    // The admin must never read a stale list after saving a change.
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as {
    detail?: string;
    errors?: Array<{ message?: string; location?: string }>;
  };

  if (!response.ok) {
    // Field-level validation errors are far more useful than "validation
    // failed", so they are surfaced rather than swallowed.
    const fieldErrors = body.errors
      ?.map((e) => [e.location, e.message].filter(Boolean).join(": "))
      .filter(Boolean);

    const message =
      fieldErrors && fieldErrors.length > 0
        ? fieldErrors.join("; ")
        : (body.detail ?? `Terjadi kesalahan (HTTP ${response.status})`);

    throw new AdminApiError(response.status, message);
  }

  return body as T;
}

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

export function login(email: string, password: string): Promise<{ user: AdminUser }> {
  return request("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request("/v1/auth/logout", { method: "POST" });
}

export function currentUser(): Promise<{ user: AdminUser }> {
  return request("/v1/auth/me");
}

/**
 * Exchanges the refresh cookie for a new session.
 *
 * Access tokens last 15 minutes, so an admin editing a long product form would
 * otherwise be logged out mid-edit. Callers retry the original request once
 * after a successful refresh.
 */
export function refreshSession(): Promise<{ user: AdminUser }> {
  return request("/v1/auth/refresh", { method: "POST" });
}

// --------------------------------------------------------------------------
// Products
// --------------------------------------------------------------------------

export function listProducts(page = 1, pageSize = 100): Promise<ProductList> {
  return request(`/v1/admin/products?page=${page}&pageSize=${pageSize}`);
}

export function getProduct(id: string): Promise<{ product: Product }> {
  return request(`/v1/admin/products/${id}`);
}

export function createProduct(data: ProductWrite): Promise<{ product: Product }> {
  return request("/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(
  id: string,
  data: ProductWrite,
): Promise<{ product: Product }> {
  return request(`/v1/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return request(`/v1/admin/products/${id}`, { method: "DELETE" });
}

// --------------------------------------------------------------------------
// Services
// --------------------------------------------------------------------------

export function listServices(): Promise<ServiceList> {
  return request("/v1/admin/services");
}

export function getService(id: string): Promise<{ service: Service }> {
  return request(`/v1/admin/services/${id}`);
}

export function createService(data: ServiceWrite): Promise<{ service: Service }> {
  return request("/v1/admin/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateService(
  id: string,
  data: ServiceWrite,
): Promise<{ service: Service }> {
  return request(`/v1/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteService(id: string): Promise<void> {
  return request(`/v1/admin/services/${id}`, { method: "DELETE" });
}

// --------------------------------------------------------------------------
// Leads
// --------------------------------------------------------------------------

export function listLeads(status?: string, page = 1): Promise<LeadList> {
  const params = new URLSearchParams({ page: String(page), pageSize: "50" });
  if (status) params.set("status", status);
  return request(`/v1/admin/leads?${params}`);
}

export function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ lead: Lead }> {
  return request(`/v1/admin/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --------------------------------------------------------------------------
// Uploads
// --------------------------------------------------------------------------

/**
 * Uploads an image straight to object storage.
 *
 * The API only signs the request; the bytes go directly to the bucket, so a
 * large photo never passes through the API's memory or request timeout.
 */
export async function uploadImage(file: File): Promise<{ objectKey: string; publicUrl: string }> {
  const target = await request<UploadTarget>("/v1/admin/uploads", {
    method: "POST",
    body: JSON.stringify({ contentType: file.type }),
  });

  const upload = await fetch(target.uploadUrl, {
    method: "PUT",
    body: file,
    // Must match the type bound into the presigned signature, or the bucket
    // rejects the upload.
    headers: { "Content-Type": file.type },
  });

  if (!upload.ok) {
    throw new AdminApiError(upload.status, "Gagal mengunggah gambar ke penyimpanan");
  }

  return { objectKey: target.objectKey, publicUrl: target.publicUrl };
}
