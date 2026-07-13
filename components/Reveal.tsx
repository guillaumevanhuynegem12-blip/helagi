"use client";

// Gentle entrance-on-scroll wrapper for landing-page sections.
//
// Safety first: the server renders content fully visible, and it is only
// hidden after hydration — and only when the element is still below the fold.
// No JS, reduced-motion, or an ancient browser all degrade to "just visible".

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** stagger offset in ms, for sibling cards */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "initial" = SSR/no-JS: visible. "hidden" = waiting to scroll in.
  const [state, setState] = useState<"initial" | "hidden" | "shown">("initial");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      setState("shown");
      return;
    }
    // Already on screen at load — never hide it, so nothing flashes.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setState("shown");
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${className} transition-all duration-700 ease-out ${
        state === "hidden" ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
