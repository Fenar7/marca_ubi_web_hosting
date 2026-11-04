import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";

import {
  acquireOverlayScrollLock,
  isOverlayScrollLocked,
  onOverlayScrollLockChange,
  releaseOverlayScrollLock,
} from "@/app/lib/overlayScrollLock";

/**
 * @file overlay-scroll-lock.test.ts
 * @description The one lock five overlays share.
 *
 *              These cases are the exact shape of the bug the owner reported as "on the other pages the
 *              scroll does not work": the navigation overlay, the chat pod, the profile modal, the reel
 *              and the header each held the viewport themselves, so closing any one of them decided
 *              whether every one of them was still holding it. A refcount is only worth having if the
 *              nesting is proven, which is what runs below — and it is proven here rather than in a
 *              browser because the failure is a counting failure, not a layout one.
 *
 *              The tests run without a DOM on purpose: the module keeps the count and the viewport write
 *              apart, so a regression in the arithmetic fails here, and a regression in the write fails
 *              in the browser suite where the wheel can actually be measured.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

describe("Overlay scroll lock (one page, five possible owners)", () => {
  it("stays locked while any single surface still holds it", () => {
    acquireOverlayScrollLock("site-navigation");
    acquireOverlayScrollLock("chat-pod");
    assert.equal(isOverlayScrollLocked(), true);

    // The defect this replaces: the navigation closing cleared the overflow the pod was relying on, so
    // the page behind an open dialog scrolled again.
    releaseOverlayScrollLock("site-navigation");
    assert.equal(isOverlayScrollLocked(), true, "a hold one surface still owns cannot be released by another");

    releaseOverlayScrollLock("chat-pod");
    assert.equal(isOverlayScrollLocked(), false, "the page is free once every owner has handed back");
  });

  it("counts an owner once, however many times it acquires", () => {
    acquireOverlayScrollLock("chat-pod");
    acquireOverlayScrollLock("chat-pod");

    // A double-acquire that counted twice would need a double-release, and a surface that re-renders
    // without releasing the first time would hold the page forever.
    releaseOverlayScrollLock("chat-pod");
    assert.equal(isOverlayScrollLocked(), false, "one owner is one hold, so one release is enough");
  });

  it("ignores a release nobody holds", () => {
    releaseOverlayScrollLock("never-opened");
    assert.equal(isOverlayScrollLocked(), false);
  });

  it("tells subscribers only on the edges, and tells them the truth on subscribe", () => {
    const seen: boolean[] = [];
    const unsubscribe = onOverlayScrollLockChange((locked) => seen.push(locked));

    // A controller that mounts while a dialog is already open has to end up holding the page too. The
    // class-reading version got this wrong on every slow initial load, because the event had fired first.
    assert.deepEqual(seen, [false], "a subscription reports the current state before anything changes");

    acquireOverlayScrollLock("reel-modal");
    acquireOverlayScrollLock("chat-pod");
    releaseOverlayScrollLock("reel-modal");
    releaseOverlayScrollLock("chat-pod");
    assert.deepEqual(seen, [false, true, false], "only the edges of the count are worth announcing");

    unsubscribe();
    acquireOverlayScrollLock("company-profile");
    assert.deepEqual(seen, [false, true, false], "an unsubscribed controller stops hearing about the page");
    releaseOverlayScrollLock("company-profile");
  });

  it("keeps the count when the viewport write cannot run", () => {
    // No `document` in this runtime, and the module must not lose the hold over it — the subscribers are
    // React and the scroll controller, and they need the same answer with or without a browser.
    acquireOverlayScrollLock("site-navigation");
    assert.equal(isOverlayScrollLocked(), true);
    releaseOverlayScrollLock("site-navigation");
  });

  it("finishes the round when a subscriber fails", () => {
    // A subscriber is foreign code — the scroll controller calling into Lenis — and this module is the
    // boundary. An aborted round leaves the healthy controller holding a page nobody gave it, and a
    // throw escaping `acquire` kills the React effect halfway, which is a hold with no owner left to
    // release it. Both of those are the defect the count exists to remove, so the failure is reported
    // and the round completes.
    const heard: boolean[] = [];
    const reported: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => reported.push(args[0]);

    const unsubscribeBroken = onOverlayScrollLockChange(() => {
      throw new Error("lenis is gone");
    });
    const unsubscribeGood = onOverlayScrollLockChange((locked) => heard.push(locked));

    try {
      // The broken subscriber threw on the way in and still handed back its unsubscribe, rather than
      // staying in the registry forever with nobody able to remove it.
      assert.equal(reported.length, 1, "a subscriber that throws on subscribe is reported, not swallowed");
      assert.deepEqual(heard, [false]);

      assert.doesNotThrow(() => acquireOverlayScrollLock("chat-pod"));
      assert.deepEqual(heard, [false, true], "the healthy subscriber is told even though its neighbour threw");

      releaseOverlayScrollLock("chat-pod");
      assert.deepEqual(heard, [false, true, false]);
      assert.equal(isOverlayScrollLocked(), false, "a failing subscriber cannot hold the page hostage");
    } finally {
      unsubscribeBroken();
      unsubscribeGood();
      console.error = originalError;
    }
  });
});

describe("Overlay surfaces (one lock, no private copies)", () => {
  const read = (relative: string) => readFileSync(path.resolve(relative), "utf8");

  /** Every public surface that puts something on top of the page, and the token it holds it under. */
  const holdersByFile: ReadonlyArray<readonly [string, string]> = [
    ["src/app/components/NavigationOverlay/NavigationOverlay.tsx", '"site-navigation"'],
    ["src/app/components/Hero/CompanyProfileModal.tsx", '"company-profile"'],
    ["src/app/components/ReelModal/ReelModal.tsx", '"reel-modal"'],
    ["src/app/chat-pod/ChatPod.tsx", '"chat-pod"'],
  ];

  for (const [file, token] of holdersByFile) {
    it(`holds the page from the shared lock in ${file}`, () => {
      const source = read(file);
      assert.ok(source.includes("useOverlayScrollLock("), `${file} must take the lock, not write the viewport itself`);
      assert.ok(source.includes(token), `${file} must hold it under the name ${token}`);
      assert.ok(
        !source.includes('document.body.style.overflow = "hidden"') && !source.includes("document.body.style.overflow = 'hidden'"),
        `${file} owning body overflow is the second lock the surfaces used to keep for themselves`,
      );
    });
  }

  it("opts every overlay scroll root out of the smooth-scroll hijack", () => {
    // A stopped Lenis still cancels wheel and touchmove outside a `data-lenis-prevent` subtree, so a
    // dialog that holds the page and scrolls its own content has to say so — this is the defect that
    // made the menus and the forms feel broken on pages with nothing wrong with them.
    for (const file of [
      "src/app/chat-pod/ChatPod.tsx",
      "src/app/components/NavigationOverlay/NavigationOverlay.tsx",
      "src/app/components/Hero/CompanyProfileModal.tsx",
      "src/app/components/ReelModal/ReelModal.tsx",
    ]) {
      assert.ok(read(file).includes("data-lenis-prevent"), `${file} scrolls inside a locked page and must be exempt`);
    }
  });

  it("drives Lenis from the lock instead of from a class somebody set", () => {
    const provider = read("src/app/components/SmoothScrollProvider/SmoothScrollProvider.tsx");
    assert.ok(provider.includes("onOverlayScrollLockChange"), "the controller subscribes to the count");
    assert.ok(provider.includes("isOverlayScrollLocked()"), "the controller asks the count before starting the hijack");
    assert.ok(
      !provider.includes('classList.contains("menu-open")') && !provider.includes('classList.contains("profile-modal-open")'),
      "reading body classes was how the controller guessed at an overlay instead of being told",
    );
    assert.ok(
      !provider.includes('"menu:open"') && !provider.includes('"profile-modal:open"'),
      "the bespoke open events are gone; the lock is the only channel",
    );
  });
});
