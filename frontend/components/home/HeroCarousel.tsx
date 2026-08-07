"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SLIDES = [
  { src: "/pasang_ac.png", caption: "Pemasangan AC baru" },
  { src: "/cuci_ac.png", caption: "Cuci AC berkala" },
  { src: "/service_ac.png", caption: "Servis dan perbaikan" },
  { src: "/unit_ac.png", caption: "Unit resmi siap kirim" },
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
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.caption}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Foto sebelumnya"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-black text-white shadow-sm transition-colors hover:bg-ink-800"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Foto berikutnya"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-black text-white shadow-sm transition-colors hover:bg-ink-800"
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ke foto ${i + 1}: ${slide.caption}`}
            aria-current={i === index}
            className="h-2 overflow-hidden rounded-full bg-ink-400 transition-[width] duration-300 ease-out"
            style={{ width: i === index ? "2rem" : "0.5rem" }}
          >
            {i === index ? (
              <span
                key={index}
                className="block h-full w-0 bg-white"
                style={{
                  animationName: "carousel-progress",
                  animationDuration: `${INTERVAL_MS}ms`,
                  animationTimingFunction: "linear",
                  animationFillMode: "both",
                  animationPlayState: paused ? "paused" : "running",
                  animationDelay: "300ms",
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
