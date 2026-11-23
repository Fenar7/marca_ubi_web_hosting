import React from "react";
import styles from "./DealsWorkspaceClient.module.scss";

/** Card-sized placeholders preserve structure while the authenticated route resolves. */
export function DealsLoading(): React.ReactElement {
  return (
    <div className={styles.loadingState} role="status" aria-busy="true">
      <span>Loading deals…</span>
      <div aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <section key={index}>
            {Array.from({ length: 2 }, (_, card) => (
              <i key={card} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
