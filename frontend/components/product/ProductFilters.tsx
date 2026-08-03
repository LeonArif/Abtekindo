"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import {
  BRANDS,
  CAPACITIES,
  PRODUCT_TYPES,
  type Brand,
  type ProductType,
} from "@/lib/api/types";
import { brandLabel, productTypeLabel } from "@/lib/format";
import { formatPk } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

/**
 * Catalog facets.
 *
 * Filter state lives entirely in the URL rather than in component state. That
 * makes a filtered view shareable, bookmarkable, survivable across a reload,
 * and crawlable, and it means the server component does the actual filtering
 * so no product data ships to the browser just to be hidden again.
 */
export function ProductFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Keeps the current results visible while the server renders the next page,
  // instead of blanking the grid on every checkbox click.
  const [isPending, startTransition] = useTransition();

  const selected = useCallback(
    (key: string): string[] => {
      const raw = searchParams.get(key);
      return raw ? raw.split(",").filter(Boolean) : [];
    },
    [searchParams],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const current = selected(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) {
        params.set(key, next.join(","));
      } else {
        params.delete(key);
      }
      // Any filter change invalidates the current page number: staying on
      // page 3 of a narrower result set usually lands on an empty page.
      params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, selected],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const activeCount =
    selected("brand").length + selected("type").length + selected("pk").length;

  return (
    <div
      className={cn("space-y-6 transition-opacity", isPending && "opacity-60")}
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{total}</span> produk
        </p>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Hapus filter ({activeCount})
          </button>
        ) : null}
      </div>

      <FilterGroup
        legend="Merek"
        options={BRANDS.map((b: Brand) => ({ value: b, label: brandLabel(b) }))}
        selected={selected("brand")}
        onToggle={(v) => toggle("brand", v)}
      />

      <FilterGroup
        legend="Tipe"
        options={PRODUCT_TYPES.map((t: ProductType) => ({
          value: t,
          label: productTypeLabel(t),
        }))}
        selected={selected("type")}
        onToggle={(v) => toggle("type", v)}
      />

      <FilterGroup
        legend="Kapasitas"
        options={CAPACITIES.map((pk) => ({
          value: String(pk),
          label: `${formatPk(pk)} PK`,
        }))}
        selected={selected("pk")}
        onToggle={(v) => toggle("pk", v)}
      />
    </div>
  );
}

function FilterGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink-900">{legend}</legend>
      <div className="mt-3 space-y-1">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-ink-700 hover:bg-ink-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus-visible:outline-brand-600"
              />
              <span className={cn(checked && "font-medium text-ink-900")}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
