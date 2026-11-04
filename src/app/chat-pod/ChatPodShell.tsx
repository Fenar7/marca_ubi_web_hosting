"use client";

/**
 * @file ChatPodShell.tsx
 * @description The client half of the mount: it decides *whether* the pod exists on this route and
 *              *when* its chunk is allowed to cost anything. It owns no conversation state, which is
 *              what keeps this file small enough to sit in the base bundle while the panel itself
 *              stays in a deferred chunk.
 *
 *              Three gates, in this order:
 *              1. Route. `/start-project` is the long form doing the same job, and `/studio` and
 *                 `/admin` are internal surfaces where a visitor-facing assistant is nonsense.
 *              2. Loader. The site paints an intro loader over the first viewport. A launcher that
 *                 appears under it is invisible, and one that appears the instant it lifts competes
 *                 with the hero's entrance animation for the main thread.
 *              3. Idle. The chunk is 1 network request plus parse. Loading it the moment the loader
 *                 finishes still steals cycles from the hero, so it goes in on the first idle slice,
 *                 or immediately if the visitor has already interacted.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { KnowledgeBase } from "./types";

/**
 * Exact-match prefixes, not full paths: `/services` would exclude nothing today because there is no
 * index route, while `/admin` must also cover `/admin/leads`.
 */
const EXCLUDED_ROUTES = ["/start-project", "/studio", "/admin"] as const;

/**
 * Ceiling on waiting for the intro loader. Mirrors `FloatingExploreButton.tsx:61`, which uses the
 * same 12s backstop: if the loader's completion event is ever missed, the pod must still arrive.
 */
const LOADER_BACKSTOP_MS = 12_000;

/** How long the pod may wait for an idle slice before it loads regardless. */
const IDLE_DEADLINE_MS = 2_500;

/**
 * The panel. `ssr: false` is not decoration: the component reads `window`, `matchMedia` and
 * `localStorage`, so a server render would be a render that cannot match its own hydration.
 * Declared at module scope so the chunk identity is stable across re-renders.
 */
const ChatPod = dynamic(() => import("./ChatPod"), { ssr: false, loading: () => null });

/**
 * True once the intro loader is finished and the main thread has a free slice.
 *
 * The three early-resolve paths are deliberate. `data-loader-complete` on the document element means
 * the loader already ran and finished before this effect attached; no `[data-initial-loader]` node
 * means this route never had a loader (the blog, careers and service pages are not hero pages);
 * either way, waiting for an event that will never fire would strand the launcher behind a backstop
 * timer for no reason.
 */
function useMountPermitted(enabled: boolean): boolean {
  const [permitted, setPermitted] = useState(false);

  useEffect(() => {
    if (!enabled || permitted) return;

    let idleHandle: number | ReturnType<typeof setTimeout> | undefined;
    let backstop: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const release = () => {
      if (cancelled) return;
      cancelled = true;
      setPermitted(true);
    };

    const schedule = () => {
      // Safari has no requestIdleCallback; a bare timeout is the honest fallback rather than
      // pretending the signal exists.
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(release, { timeout: IDLE_DEADLINE_MS });
      } else {
        idleHandle = setTimeout(release, 200);
      }
    };

    const done = () => {
      window.removeEventListener("initial-loader:complete", done);
      clearTimeout(backstop);
      schedule();
    };

    if (document.documentElement.getAttribute("data-loader-complete") === "true") {
      schedule();
    } else if (!document.querySelector("[data-initial-loader]")) {
      schedule();
    } else {
      window.addEventListener("initial-loader:complete", done);
      // A visitor who has already touched the page should not have to wait for the loader at all.
      backstop = setTimeout(done, LOADER_BACKSTOP_MS);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("initial-loader:complete", done);
      clearTimeout(backstop);
      if (idleHandle !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleHandle as number);
        else clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
    };
  }, [enabled, permitted]);

  return permitted;
}

export default function ChatPodShell({ knowledge }: { knowledge: KnowledgeBase }) {
  const pathname = usePathname();
  const excluded = EXCLUDED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const permitted = useMountPermitted(!excluded);

  if (excluded || !permitted) return null;
  return <ChatPod knowledge={knowledge} />;
}
