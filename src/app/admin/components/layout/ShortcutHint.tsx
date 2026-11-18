"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverHint = () => "Ctrl K";
const browserHint = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

/** Stable server fallback avoids platform-dependent hydration differences. */
export function ShortcutHint(): React.ReactElement {
  const hint = useSyncExternalStore(subscribe, browserHint, serverHint);
  return <kbd>{hint}</kbd>;
}
