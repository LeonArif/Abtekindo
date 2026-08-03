"use client";

import type { ComponentProps, ReactNode } from "react";

/**
 * Form controls for the CMS.
 *
 * Every control pairs a real <label> with its input by id, so clicking the
 * label focuses the field and screen readers announce it. Hints are wired up
 * with aria-describedby rather than left as loose text.
 */

const inputClass =
  "mt-1.5 w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-base text-ink-900 " +
  "placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 " +
  "disabled:bg-ink-100";

export function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-card border border-ink-200 bg-white p-6">
      <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
        {legend}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export function Field({
  label,
  name,
  hint,
  required = false,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
} & ComponentProps<"input">) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-describedby={hintId}
        className={inputClass}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  required = false,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
} & ComponentProps<"textarea">) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-describedby={hintId}
        className={inputClass}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  hint,
  required = false,
  ...props
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  required?: boolean;
} & ComponentProps<"select">) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        aria-describedby={hintId}
        className={inputClass}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  label,
  name,
  hint,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
} & ComponentProps<"input">) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label
        htmlFor={name}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink-800"
      >
        <input
          id={name}
          name={name}
          type="checkbox"
          aria-describedby={hintId}
          className="h-4 w-4 rounded border-ink-300 text-brand-600"
          {...props}
        />
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="ml-7 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
