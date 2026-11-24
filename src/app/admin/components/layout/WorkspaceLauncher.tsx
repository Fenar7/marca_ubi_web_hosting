"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CurrentUserSession } from "./UserProfileDropdown";
import { getNavigationSearchResults } from "./navigationConfig";
import styles from "./WorkspaceLauncher.module.scss";

/** Native modal semantics provide focus containment and inert background; results retain route tab policy. */
export function WorkspaceLauncher({
  currentUser,
}: {
  currentUser: CurrentUserSession;
}): React.ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const results = getNavigationSearchResults(query, currentUser);

  useEffect(() => {
    const open = () => {
      if (dialog.current?.open) return;
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setQuery("");
      dialog.current?.showModal();
      input.current?.focus();
    };
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("open-command-palette", open);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("open-command-palette", open);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  function close(): void {
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="workspace-launcher-title"
      onClose={() =>
        previousFocus.current?.isConnected && previousFocus.current.focus()
      }
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className={styles.surface}>
        <div className={styles.heading}>
          <h2 id="workspace-launcher-title">Search or navigate</h2>
          <button type="button" onClick={close} aria-label="Close search">
            Esc
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) {
              close();
              router.push(results[0].href);
            }
          }}
        >
          <label className={styles.label} htmlFor="workspace-launcher-query">
            Find a page, or search leads and deals
          </label>
          <input
            ref={input}
            id="workspace-launcher-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={200}
            autoComplete="off"
            placeholder="Type a page or client name…"
          />
        </form>
        <div className={styles.results}>
          <p className={styles.count} role="status">
            {results.length
              ? `${results.length} available destinations`
              : "No permitted destinations match this search."}
          </p>
          <ul>
            {results.map((result) => (
              <li key={result.href}>
                <Link href={result.href} onClick={close}>
                  <span>{result.label}</span>
                  <small>
                    {result.kind === "search" ? "Search records" : "Open page"}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.help}>
          Record searches open the selected workspace with your query applied.
        </p>
      </div>
    </dialog>
  );
}
