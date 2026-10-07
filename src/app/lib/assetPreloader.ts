/**
 * Critical asset preloader & GPU texture warming utility.
 * Coordinates asset readiness between InitialLoader and Hero, guaranteeing that
 * critical visual assets (Hero background, logos, and fonts) are fully loaded
 * and GPU-decoded before the loader curtain lifts.
 */

export function decodeImageElement(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) {
    if (typeof img.decode === "function") {
      return img.decode().catch(() => {});
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };

    if (img.complete) {
      finish();
      return;
    }

    img.addEventListener("load", finish, { once: true });
    img.addEventListener("error", finish, { once: true });
  });
}

export function preloadImageSource(src: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };

    img.onload = finish;
    img.onerror = finish;
    img.src = src;

    if (img.complete) {
      finish();
    }
  });
}

export async function preloadCriticalAssets(timeoutMs = 3800): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const tasks: Promise<void>[] = [];

  // 1. Web Fonts readiness
  if ("fonts" in document && document.fonts?.ready) {
    tasks.push(document.fonts.ready.then(() => {}).catch(() => {}));
  }

  // 2. Critical UI graphics (loader logo, brand mark, button icon)
  const criticalImages = [
    "/hero/marca-ubi-logo.png",
    "/images/ubi.png",
    "/images/marca.png",
    "/hero/primary-arrow.png",
  ];

  criticalImages.forEach((src) => {
    tasks.push(preloadImageSource(src));
  });

  // 3. Find Next.js Hero background image in DOM and decode it
  const findAndDecodeHeroImage = new Promise<void>((resolve) => {
    const locate = (): HTMLImageElement | null => {
      return (
        document.querySelector<HTMLImageElement>("[data-hero-bg-image]") ||
        document.querySelector<HTMLImageElement>("section[data-node-id='491:896'] img")
      );
    };

    const initial = locate();
    if (initial) {
      decodeImageElement(initial).then(resolve);
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      const el = locate();
      if (el) {
        window.clearInterval(interval);
        decodeImageElement(el).then(resolve);
      } else if (attempts >= 10) {
        window.clearInterval(interval);
        // Fallback: preload the source directly
        preloadImageSource("/images/bg-cover-image-3.png").then(resolve);
      }
    }, 40);
  });

  tasks.push(findAndDecodeHeroImage);

  // 4. Bound entire preloading with safety timeout so loader never hangs under poor network
  const allTasks = Promise.all(tasks).then(() => {});
  const safetyTimeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });

  await Promise.race([allTasks, safetyTimeout]);
}
