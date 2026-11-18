import React from "react";
import styles from "../components/Dashboard/OverviewWorkspace.module.scss";

/** Preserve working navigation while a workspace's authenticated server reads are pending. */
export default function WorkspaceLoading(): React.ReactElement {
  return (
    <div className={styles.overview} aria-busy="true" role="status">
      <p className={styles.context}>Commercial workspace</p>
      <h1>Loading your workspace</h1>
      <div className={styles.loadingRows} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <p>Retrieving the records you can access…</p>
    </div>
  );
}
