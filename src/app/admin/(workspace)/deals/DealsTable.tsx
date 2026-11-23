"use client";

import React from "react";
import Link from "next/link";
import type {
  FunnelStatusItem,
  HydratedDealItem,
} from "./DealsWorkspaceClient";
import { DealActionsMenu } from "./DealActionsMenu";
import { DealIcon } from "./DealIcon";
import {
  canMoveDeal,
  dealIdentity,
  followUpPresentation,
  ownerIdentity,
} from "./dealPresentation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { DealSortField } from "./dealsWorkspaceModel";
import styles from "./DealsWorkspaceClient.module.scss";

interface DealsTableProps {
  deals: HydratedDealItem[];
  stages: FunnelStatusItem[];
  userRole?: string;
  financial: boolean;
  sort: DealSortField;
  ascending: boolean;
  onSort: (field: DealSortField, ascending?: boolean) => void;
  onMove: (deal: HydratedDealItem, stage: FunnelStatusItem) => void;
  movingId: string | null;
  nowMs: number | null;
}

/** Board and Table share identity/actions while a semantic table exposes the true local sort state. */
export function DealsTable({
  deals,
  stages,
  userRole,
  financial,
  sort,
  ascending,
  onSort,
  onMove,
  movingId,
  nowMs,
}: DealsTableProps): React.ReactElement {
  const columns: { field: DealSortField; label: string }[] = [
    { field: "identity", label: "Deal" },
    { field: "status_name", label: "Stage" },
    ...(financial
      ? [{ field: "expected_value" as const, label: "Expected value" }]
      : []),
    { field: "assigned_to_name", label: "Owner" },
    { field: "next_follow_up", label: "Follow-up" },
    { field: "priority", label: "Priority" },
  ];
  function rowContent(
    deal: HydratedDealItem,
    mobile: boolean,
  ): React.ReactElement {
    const identity = dealIdentity(deal);
    const owner = ownerIdentity(deal);
    const schedule = followUpPresentation(deal, nowMs);
    const title = (
      <div className={styles.identity}>
        <Link
          href={`/admin/deals/${encodeURIComponent(deal.id)}`}
          prefetch={false}
        >
          {identity.title}
        </Link>
        <span>{identity.contact || deal.lead_id}</span>
        {identity.contact && <small>{deal.lead_id}</small>}
      </div>
    );
    const actions = (
      <DealActionsMenu
        deal={deal}
        stages={stages}
        canMove={canMoveDeal(deal, userRole)}
        moving={movingId === deal.id}
        disabled={movingId !== null}
        onMove={onMove}
      />
    );
    const ownerCell = (
      <span className={styles.ownerCell}>
        <span className={styles.avatar} aria-hidden="true">
          {owner.initials || <DealIcon name="person" />}
        </span>
        <span>{owner.name}</span>
      </span>
    );
    const dueCell = (
      <span
        className={`${styles.followUp} ${schedule.overdue ? styles.overdue : ""}`}
      >
        <DealIcon name="calendar" />
        {schedule.label}
      </span>
    );
    if (mobile)
      return (
        <article className={styles.mobileRecord}>
          <div className={styles.mobileIdentity}>
            {title}
            {actions}
          </div>
          <div className={styles.mobileSummary}>
            <span className={styles.stageTag}>{deal.status_name}</span>
            {financial && (
              <strong>
                {deal.expected_value === null
                  ? "Value unavailable"
                  : formatCrmCurrency(deal.expected_value)}
              </strong>
            )}
          </div>
          {dueCell}
          <footer>
            {ownerCell}
            <span
              className={styles.priority}
              data-priority={deal.priority.toLowerCase()}
            >
              {deal.priority}
            </span>
          </footer>
        </article>
      );
    return (
      <>
        <td>{title}</td>
        <td>
          <span className={styles.stageTag}>
            <DealIcon name="stage" />
            {deal.status_name}
          </span>
        </td>
        {financial && (
          <td className={styles.amount}>
            {deal.expected_value === null
              ? "Unavailable"
              : formatCrmCurrency(deal.expected_value)}
          </td>
        )}
        <td>{ownerCell}</td>
        <td>{dueCell}</td>
        <td>
          <span
            className={styles.priority}
            data-priority={deal.priority.toLowerCase()}
          >
            {deal.priority}
          </span>
        </td>
        <td>
          <div className={styles.rowActions}>
            <Link
              href={`/admin/deals/${encodeURIComponent(deal.id)}`}
              prefetch={false}
              aria-label={`Open ${identity.title}`}
            >
              Open
            </Link>
            {actions}
          </div>
        </td>
      </>
    );
  }
  return (
    <section aria-label="Deals table" className={styles.tableSection}>
      <div className={styles.tableScope}>
        <span>{deals.length} deals on this page</span>
        <label>
          Sort this page
          <select
            value={`${sort}:${ascending ? "asc" : "desc"}`}
            onChange={(event) => {
              const [field, direction] = event.target.value.split(":");
              onSort(field as DealSortField, direction === "asc");
            }}
          >
            {columns.flatMap((column) =>
              ["asc", "desc"].map((direction) => (
                <option
                  key={`${column.field}:${direction}`}
                  value={`${column.field}:${direction}`}
                >
                  {column.label}:{" "}
                  {direction === "asc" ? "ascending" : "descending"}
                </option>
              )),
            )}
          </select>
        </label>
      </div>
      {deals.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No deals match these filters</h2>
          <p>Try a broader search or clear a filter.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.dealsTable}>
              <caption className={styles.srOnly}>
                Deals on the current result page. Column controls sort only this
                page.
              </caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.field}
                      scope="col"
                      aria-sort={
                        sort === column.field
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSort(column.field)}
                      >
                        {column.label}
                        <span aria-hidden="true">
                          {sort === column.field
                            ? ascending
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} aria-busy={movingId === deal.id}>
                    {rowContent(deal, false)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileRecords}>
            {deals.map((deal) => (
              <React.Fragment key={deal.id}>
                {rowContent(deal, true)}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
