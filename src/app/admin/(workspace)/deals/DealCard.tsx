"use client";

import { useState, type DragEvent } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import { DealActionsMenu } from "./DealActionsMenu";
import { DealIcon } from "./DealIcon";
import {
  dealIdentity,
  followUpPresentation,
  ownerIdentity,
} from "./dealPresentation";
import type {
  FunnelStatusItem,
  HydratedDealItem,
} from "./DealsWorkspaceClient";
import styles from "./DealCard.module.scss";

interface DealCardProps {
  deal: HydratedDealItem;
  stages: FunnelStatusItem[];
  canMove: boolean;
  movePending: boolean;
  moving: boolean;
  nowMs: number | null;
  canViewFinancials: boolean;
  onMove: (deal: HydratedDealItem, stage: FunnelStatusItem) => void;
  onDragStart?: (event: DragEvent<HTMLSpanElement>) => void;
  onDragEnd?: () => void;
}

/** Compact identity and next-conversation context stay visible; administrative controls are progressive disclosure. */
export function DealCard({
  deal,
  stages,
  canMove,
  movePending,
  moving,
  nowMs,
  canViewFinancials,
  onMove,
  onDragStart,
  onDragEnd,
}: DealCardProps) {
  const identity = dealIdentity(deal);
  const owner = ownerIdentity(deal);
  const due = followUpPresentation(deal, nowMs);
  const [feedback, setFeedback] = useState("");
  const classification = deal.service_category || deal.source_name;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(deal.lead_id);
      setFeedback(`Copied ${deal.lead_id}`);
    } catch (error: unknown) {
      console.error(
        "[deal-card] Copy failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      setFeedback("Could not copy reference");
    }
  }

  return (
    <article
      className={styles.card}
      aria-label={`${identity.title}, ${deal.lead_id}`}
      aria-busy={moving}
    >
      <div className={styles.top}>
        {classification && (
          <span className={styles.classification}>{classification}</span>
        )}
        <span
          className={styles.priority}
          data-priority={deal.priority.toLowerCase()}
        >
          {deal.priority}
        </span>
        <DealActionsMenu
          deal={deal}
          stages={stages}
          canMove={canMove}
          moving={moving}
          disabled={movePending}
          onMove={onMove}
        />
      </div>
      <h3 className={styles.title}>
        <Link
          href={`/admin/deals/${encodeURIComponent(deal.id)}`}
          prefetch={false}
        >
          {identity.title}
        </Link>
      </h3>
      {identity.contact && <p className={styles.contact}>{identity.contact}</p>}
      {canViewFinancials && (
        <p className={styles.value}>
          <span className={styles.srOnly}>Expected value </span>
          {deal.expected_value === null
            ? "Value unavailable"
            : formatCrmCurrency(deal.expected_value)}
        </p>
      )}
      <p className={`${styles.schedule} ${due.overdue ? styles.overdue : ""}`}>
        <DealIcon name="calendar" />
        <span>{due.label}</span>
      </p>
      <div className={styles.footer}>
        <span className={styles.owner}>
          {owner.initials ? (
            <span className={styles.avatar} aria-hidden="true">
              {owner.initials}
            </span>
          ) : (
            <DealIcon name="person" />
          )}
          <span>{owner.name}</span>
        </span>
        <button
          type="button"
          className={styles.reference}
          onClick={() => void copyReference()}
          title="Copy reference"
          aria-label={`Copy ${deal.lead_id}`}
        >
          {deal.lead_id}
        </button>
        {canMove && (
          <span
            className={styles.grip}
            draggable={!movePending}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag to another stage"
            aria-hidden="true"
          >
            <DealIcon name="grip" />
          </span>
        )}
      </div>
      {feedback && (
        <p role="status" className={styles.feedback}>
          {feedback}
        </p>
      )}
      {moving && (
        <p className={styles.saving} role="status">
          Saving stage…
        </p>
      )}
    </article>
  );
}
