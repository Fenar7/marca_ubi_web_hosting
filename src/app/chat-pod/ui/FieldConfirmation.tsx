"use client";

import styles from "../ChatPod.module.scss";

interface Props {
  label: string;
  value: string;
  onUseValue: () => void;
  onAsk: () => void;
}

/** An ambiguous title stays reversible rather than being refused or silently filed as CRM data. */
export default function FieldConfirmation({ label, value, onUseValue, onAsk }: Props) {
  return (
    <div className={styles.fieldConfirmation} role="group" aria-label="Confirm your answer">
      <p>Should I use <strong>{value}</strong> as your {label.toLowerCase()}, or answer it as a question?</p>
      <div className={styles.taskActionRow}>
        <button type="button" className={styles.taskSecondary} onClick={onAsk}>Ask about this</button>
        <button type="button" className={styles.taskPrimary} onClick={onUseValue}>Use as {label.toLowerCase()}</button>
      </div>
    </div>
  );
}
