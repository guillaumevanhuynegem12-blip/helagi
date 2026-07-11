"use client";

// Global analytics hooks, mounted once in app/layout.tsx:
// - a page_view event per route change (this is how landing-page visits and
//   AI-page opens are counted),
// - a session_end event with the time spent, sent via beacon when the tab is
//   hidden/closed.
// Both go through track(), which drops everything unless the visitor has
// consented to analytics cookies.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export default function AnalyticsListener() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    const start = Date.now();
    // pagehide (not unload) fires reliably on tab close and mobile navigation.
    const onPageHide = () =>
      track("session_end", { durationMs: Date.now() - start });
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  return null;
}
