/**
 * Joins class names, dropping falsey values.
 *
 * Deliberately not clsx or tailwind-merge: this codebase composes classes with
 * plain conditionals and never needs conflict resolution, so a dependency would
 * buy nothing.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
