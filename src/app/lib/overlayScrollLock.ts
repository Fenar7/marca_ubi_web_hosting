import { useEffect } from "react";

/**
 * @file overlayScrollLock.ts
 * @description One refcount for "something is on top of the page, the page must not move".
 *
 *              Five public surfaces need this — the site navigation overlay, its header toggle, the
 *              company-profile modal, the reel modal and the chat pod — and they used to each implement
 *              it themselves: some wrote `document.body.style.overflow`, some dispatched a bespoke event
 *              pair, one only added a class, and the smooth-scroll controller read those classes back to
 *              decide whether to stop Lenis. That is not one lock with five owners, it is five locks that
 *              do not know about each other, and the failure is exactly what the owner reported as "on
 *              other pages the scroll just does not work":
 *
 *              - the last writer wins. Open the navigation, then the pod; close the navigation and its
 *                cleanup clears the `overflow` the pod is still relying on, so the page behind an open
 *                dialog scrolls again;
 *              - the events are not paired with reality. The header released its hold inside a GSAP
 *                `onReverseComplete`, which never runs when a reverse is interrupted, and its unmount
 *                cleanup dispatched a close every single time, whether or not anything was open. A
 *                route change under an open pod therefore told the controller to start Lenis while the
 *                pod was still on screen;
 *              - a surface that locks the body but never stops Lenis (the reel) leaves a running
 *                scroll-hijack swallowing wheel events for a page that cannot scroll.
 *
 *              So the count lives here, in one module, and the only honest lifecycle is the React one:
 *              a surface says what is open, the effect acquires, and the same effect releases on the way
 *              out — close, unmount, route change or crash, the hold cannot leak, because there is no
 *              code path that has to remember to give it back.
 *
 *              The controller subscribes rather than sniffing. `onOverlayLockChange` fires on subscribe
 *              with the current truth, so a controller that mounts after an overlay opened — which is
 *              what the class-reading version got wrong on every slow initial load — starts in the right
 *              state without guessing.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

/** Every live hold, keyed by the surface that owns it. A `Set` and not a counter, because a surface that
 *  acquires twice under the same name must not be able to hold the page hostage it cannot release. */
const holders = new Set<string>();

const listeners = new Set<(locked: boolean) => void>();

/** The body's own inline values, kept only while the page is held, so releasing restores what this
 *  surface found rather than blanking a declaration that belonged to the page. */
let saved: { overflow: string; paddingRight: string } | null = null;

/** The last state handed to subscribers, so the second, third and fourth surface opening onto a page
 *  that is already locked does not make the scroll controller stop Lenis and re-measure the document. */
let announced: boolean | null = null;

function announce(): void {
  const locked = holders.size > 0;
  if (locked === announced) return;
  announced = locked;
  listeners.forEach((listener) => notifyListener(listener, locked));
}

/**
 * Hand the viewport state to one subscriber.
 *
 * A subscriber is foreign code — the smooth-scroll controller calling `lenis.stop()` — and this module
 * is the boundary. Letting one throw abort the round would leave the other subscribers holding a page
 * nobody gave them, and letting it escape `acquire` would leave the count and the viewport disagreeing
 * with each other, which is the defect the refcount exists to remove. So the failure is reported loudly
 * and the round completes: the module's claim that the hold cannot leak depends on it.
 */
function notifyListener(listener: (locked: boolean) => void, locked: boolean): void {
  try {
    listener(locked);
  } catch (error) {
    console.error("[overlay-scroll-lock] a subscriber failed to apply the viewport state:", error);
  }
}

/** The viewport itself, as opposed to the count. Guarded, because the count is the truth the tests and
 *  the server can see and this is the part only a browser can do. */
function lockViewport(): void {
  if (typeof document === "undefined") return;

  // The scrollbar is about to disappear. Without the compensation the viewport gains a column of
  // layout width and every fixed surface — header, pod, overlay — jumps sideways as it opens.
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  saved = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
  document.body.style.overflow = "hidden";
  if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
}

function unlockViewport(): void {
  if (typeof document === "undefined" || !saved) return;
  document.body.style.overflow = saved.overflow;
  document.body.style.paddingRight = saved.paddingRight;
  saved = null;
}

/** Take the hold. Idempotent per owner token; the page is only actually locked by the first taker. */
export function acquireOverlayScrollLock(token: string): void {
  if (holders.has(token)) return;

  const first = holders.size === 0;
  holders.add(token);
  if (first) lockViewport();
  announce();
}

/** Give the hold back. The page unlocks only when the last surface has handed it over. */
export function releaseOverlayScrollLock(token: string): void {
  if (!holders.delete(token)) return;

  if (holders.size === 0) unlockViewport();
  announce();
}

/** Whether anything on top of the page currently owns it. */
export function isOverlayScrollLocked(): boolean {
  return holders.size > 0;
}

/**
 * Subscribe to the lock. The listener is called immediately with the current state, which is the whole
 * point: a controller that starts up while a dialog is open has to end up holding the page too, and it
 * cannot learn that from an event that already fired.
 */
export function onOverlayScrollLockChange(listener: (locked: boolean) => void): () => void {
  listeners.add(listener);
  notifyListener(listener, holders.size > 0);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hold the page for as long as `active` is true, and for no longer than this component exists.
 *
 * The token is the surface's own name, so a devtools inspection of `holders` says who has the page.
 */
export function useOverlayScrollLock(active: boolean, token: string): void {
  useEffect(() => {
    if (!active) return;
    acquireOverlayScrollLock(token);
    return () => releaseOverlayScrollLock(token);
  }, [active, token]);
}
