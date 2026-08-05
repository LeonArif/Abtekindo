"use client";

import { useEffect, useRef, useState } from "react";

import { AirConditionerGlyph } from "@/components/ui/Placeholder";

/**
 * Placeholder slide captions, standing in for real installation/showroom
 * photography. Swap each caption for a real <Image> once photos exist — the
 * carousel mechanics (arrows, dots, autoplay) do not need to change.
 */
const SLIDES = [
  "Pemasangan AC baru",
  "Cuci AC berkala",
  "Servis dan perbaikan",
  "Unit resmi siap kirim",
];

const INTERVAL_MS = 3000;

/**
 * Hero image carousel.
 *
 * Autoplay pauses whenever a visitor is interacting (hovering, or has just
 * used an arrow/dot), and the timer restarts from zero on every slide change
 * so a manual click never gets immediately overridden by the next tick.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, paused]);

  function go(next: number) {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }

  return (
    <div
      className="group relative aspect-[4/3] overflow-hidden border border-white/10 bg-brand-200"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 620"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hero-diag"
            width="18"
            height="18"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="18" stroke="var(--color-brand-300)" strokeWidth="8" />
          </pattern>
        </defs>
        <rect width="600" height="620" fill="url(#hero-diag)" />
      </svg>

      <div role="group" aria-label="Galeri foto Abtekindo" aria-roledescription="carousel">
        {SLIDES.map((caption, i) => (
          <div
            key={caption}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-4 text-center transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <AirConditionerGlyph className="h-24 w-24 text-brand-600" />
            <p className="max-w-xs px-6 text-sm font-medium text-ink-700">{caption}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Foto sebelumnya"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-ink-900 shadow-sm transition-colors hover:bg-white"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Foto berikutnya"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-ink-900 shadow-sm transition-colors hover:bg-white"
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((caption, i) => (
          <button
            key={caption}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ke foto ${i + 1}: ${caption}`}
            aria-current={i === index}
            className="h-1.5 w-8 overflow-hidden rounded-full bg-white/40"
          >
            {i < index ? (
              <span className="block h-full w-full bg-white" />
            ) : i === index ? (
              <span
                key={index}
                className="block h-full bg-white"
                style={{
                  animationName: "carousel-progress",
                  animationDuration: `${INTERVAL_MS}ms`,
                  animationTimingFunction: "linear",
                  animationFillMode: "forwards",
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M12 4l-6 6 6 6" : "M8 4l6 6-6 6"} />
    </svg>
  );
}
