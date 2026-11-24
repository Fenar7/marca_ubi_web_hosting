"use client";

import React, { useRef, useState } from "react";
import type { FunnelStatusItem } from "./DealsWorkspaceClient";
import { DealIcon } from "./DealIcon";
import styles from "./DealsWorkspaceClient.module.scss";

interface Option {
  id: string;
  name: string;
}
interface DealsToolbarProps {
  view: "kanban" | "table";
  search: string;
  params: string;
  stages: FunnelStatusItem[];
  owners: Option[];
  sources: Option[];
  pending: boolean;
  onSearch: (value: string) => void;
  onChange: (changes: Record<string, string | null>) => void;
}

/** Filters use one explicit submission; keyboard exploration never changes the server query by itself. */
export function DealsToolbar({
  view,
  search,
  params,
  stages,
  owners,
  sources,
  pending,
  onSearch,
  onChange,
}: DealsToolbarProps): React.ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [filterVersion, setFilterVersion] = useState(0);
  const current = new URLSearchParams(params);
  const options = [
    {
      key: "stage",
      label: "Stage",
      values: stages.map((stage) => ({ id: stage.id, name: stage.name })),
    },
    { key: "assigned_to", label: "Owner", values: owners },
    { key: "source", label: "Source", values: sources },
    {
      key: "priority",
      label: "Priority",
      values: ["High", "Medium", "Low"].map((name) => ({
        id: name.toLowerCase(),
        name,
      })),
    },
  ];
  const selected = options.filter((option) => current.has(option.key));
  function apply(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange(
      Object.fromEntries(
        options.map((option) => [
          option.key,
          String(data.get(option.key) || ""),
        ]),
      ),
    );
    dialog.current?.close();
  }
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarMain}>
        <div className={styles.viewTabs} role="group" aria-label="Deals view">
          <button
            type="button"
            aria-pressed={view === "kanban"}
            onClick={() => onChange({ view: null })}
          >
            <DealIcon name="stage" /> Board
          </button>
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => onChange({ view: "table" })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>{" "}
            Table
          </button>
        </div>
        <div className={styles.searchTools}>
          <label className={styles.searchWrapper}>
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <span className={styles.srOnly}>Search deals</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              maxLength={200}
              placeholder="Search deals, clients or reference…"
            />
          </label>
          <button
            ref={trigger}
            type="button"
            className={styles.filterButton}
            onClick={() => {
              setFilterVersion((value) => value + 1);
              dialog.current?.showModal();
            }}
            aria-haspopup="dialog"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>{" "}
            Filters{selected.length > 0 && <span>{selected.length}</span>}
          </button>
        </div>
      </div>
      <div
        className={styles.bucketRow}
        role="group"
        aria-label="Pipeline buckets"
      >
        {[
          { key: "all", name: "All stages" },
          { key: "open", name: "Open" },
          { key: "potential", name: "Potential" },
          { key: "converted", name: "Converted" },
          { key: "lost", name: "Lost" },
        ].map((bucket) => (
          <button
            key={bucket.key}
            type="button"
            aria-pressed={(current.get("bucket") || "all") === bucket.key}
            onClick={() => onChange({ bucket: bucket.key })}
          >
            {bucket.name}
          </button>
        ))}
        <span className={styles.queryState} role="status">
          {pending
            ? "Updating results…"
            : "Counts and sorting apply to this result page"}
        </span>
      </div>
      {selected.length > 0 && (
        <div className={styles.chips}>
          {selected.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange({ [option.key]: null })}
              aria-label={`Remove ${option.label} filter`}
            >
              {option.label}:{" "}
              {option.values.find(
                (value) =>
                  value.id.toLowerCase() ===
                  current.get(option.key)?.toLowerCase(),
              )?.name || "Selected value"}{" "}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                stage: null,
                assigned_to: null,
                source: null,
                priority: null,
                bucket: null,
                search: null,
              })
            }
          >
            Clear filters
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className={styles.filterDialog}
        aria-labelledby="deals-filters-title"
        onClose={() => trigger.current?.focus()}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <form ref={form} key={filterVersion} onSubmit={apply}>
          <header>
            <div>
              <h2 id="deals-filters-title">Filter deals</h2>
              <p>Refine the records in both views.</p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close filters"
            >
              ×
            </button>
          </header>
          {options.map((option) => (
            <label key={option.key}>
              {option.label}
              <select
                name={option.key}
                defaultValue={current.get(option.key) || ""}
              >
                <option value="">All {option.label.toLowerCase()}s</option>
                {option.values.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <footer>
            <button
              type="button"
              onClick={() => {
                form.current?.reset();
                onChange({
                  stage: null,
                  assigned_to: null,
                  source: null,
                  priority: null,
                });
                dialog.current?.close();
              }}
            >
              Reset
            </button>
            <button type="submit" className={styles.primary}>
              Apply filters
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
