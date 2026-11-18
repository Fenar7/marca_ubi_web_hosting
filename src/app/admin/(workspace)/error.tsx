"use client";
import React, { useEffect } from "react";
import styles from "../components/Dashboard/OverviewWorkspace.module.scss";

/** Show a safe recovery surface; error details stay in diagnostics rather than rendered customer text. */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("[workspace] Rendering failed", {
      reference: error.digest ?? "unavailable",
    });
  }, [error]);
  return (
    <div className={styles.overview} role="alert">
      <h1>Workspace couldn’t be loaded</h1>
      <p className={styles.quietState}>
        Please try again. Navigation remains available.
      </p>
      <button type="button" className={styles.secondaryButton} onClick={reset}>
        Try again
      </button>
      {error.digest && (
        <p className={styles.quietState}>Reference: {error.digest}</p>
      )}
    </div>
  );
}
