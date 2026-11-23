"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type {
  FunnelStatusItem,
  HydratedDealItem,
} from "./DealsWorkspaceClient";
import { DealCard } from "./DealCard";
import { DealIcon } from "./DealIcon";
import { allowedMoveDestinations, canMoveDeal } from "./dealPresentation";
import styles from "./DealsKanbanBoard.module.scss";

interface DealsKanbanBoardProps {
  stages: FunnelStatusItem[];
  deals: HydratedDealItem[];
  userRole?: string;
  movingDealId: string | null;
  canViewFinancials?: boolean;
  onMove: (deal: HydratedDealItem, stage: FunnelStatusItem) => void;
}

/** Loaded-page lanes preserve inactive and unknown stages; no record disappears through presentation grouping. */
export function DealsKanbanBoard({
  stages,
  deals,
  userRole,
  movingDealId,
  canViewFinancials = true,
  onMove,
}: DealsKanbanBoardProps) {
  const id = useId();
  const rail = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLSelectElement>(null);
  const dragId = useRef<string | null>(null);
  const committedMove = useRef<{ id: string; stage: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const grouped = new Map<string, HydratedDealItem[]>();
  const known = new Set(stages.map((stage) => stage.id));
  for (const deal of deals) {
    const key = known.has(deal.status_id) ? deal.status_id : "unlisted";
    grouped.set(key, [...(grouped.get(key) ?? []), deal]);
  }
  const lanes: {
    key: string;
    name: string;
    stage: FunnelStatusItem | null;
    cards: HydratedDealItem[];
  }[] = stages
    .filter((stage) => stage.is_active !== false || grouped.has(stage.id))
    .map((stage) => ({
      key: stage.id,
      name: stage.name,
      stage,
      cards: grouped.get(stage.id) ?? [],
    }));
  if (grouped.has("unlisted"))
    lanes.push({
      key: "unlisted",
      name: "Other stages",
      stage: null,
      cards: grouped.get("unlisted")!,
    });
  const active =
    lanes.find((lane) => lane.key === selected)?.key ??
    lanes.find((lane) => lane.cards.length)?.key ??
    lanes[0]?.key;
  const destinations = allowedMoveDestinations(stages);

  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const move = committedMove.current;
    if (
      !move ||
      deals.find((deal) => deal.id === move.id)?.status_id !== move.stage
    )
      return;
    committedMove.current = null;
    const frame = window.requestAnimationFrame(() => {
      setSelected(move.stage);
      if (document.activeElement === document.body) picker.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [deals]);

  function requestMove(deal: HydratedDealItem, stage: FunnelStatusItem) {
    committedMove.current = { id: deal.id, stage: stage.id };
    onMove(deal, stage);
  }

  function jump(key: string) {
    setSelected(key);
    const lane = document.getElementById(`${id}-${key}`);
    if (lane && rail.current)
      rail.current.scrollLeft +=
        lane.getBoundingClientRect().left -
        rail.current.getBoundingClientRect().left;
  }

  function adjacent(offset: number) {
    const index = lanes.findIndex((lane) => lane.key === active);
    const next = lanes[Math.max(0, Math.min(lanes.length - 1, index + offset))];
    if (next) jump(next.key);
  }

  /** Validate the current loaded record and allowed target at drop time, after any intervening filter changes. */
  function dropCandidate(stage: FunnelStatusItem | null) {
    if (
      !stage ||
      movingDealId ||
      !destinations.some((item) => item.id === stage.id)
    )
      return null;
    return (
      deals.find(
        (deal) =>
          deal.id === dragId.current &&
          deal.status_id !== stage.id &&
          canMoveDeal(deal, userRole),
      ) ?? null
    );
  }

  if (!lanes.length)
    return <p className={styles.empty}>No pipeline stages are available.</p>;
  return (
    <section className={styles.board} aria-label="Deals board">
      <div className={styles.navigator}>
        <p>Stage totals reflect this result page.</p>
        <div className={styles.laneNavigation}>
          <button
            type="button"
            onClick={() => adjacent(-1)}
            aria-label="Previous stage"
            disabled={active === lanes[0]?.key}
          >
            <DealIcon name="chevronLeft" />
          </button>
          <label>
            <span>Jump to stage</span>
            <select
              ref={picker}
              aria-label="Jump to stage"
              value={active}
              onChange={(event) => jump(event.target.value)}
            >
              {lanes.map((lane) => (
                <option key={lane.key} value={lane.key}>
                  {lane.name} ({lane.cards.length})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => adjacent(1)}
            aria-label="Next stage"
            disabled={active === lanes.at(-1)?.key}
          >
            <DealIcon name="chevronRight" />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className={styles.lanes}
        role="region"
        aria-label="Pipeline stages, scroll horizontally"
        tabIndex={0}
      >
        {lanes.map((lane) => (
          <section
            key={lane.key}
            id={`${id}-${lane.key}`}
            className={styles.lane}
            data-active={active === lane.key}
            data-drop={dropStage === lane.key}
            aria-labelledby={`${id}-${lane.key}-title`}
            onDragOver={(event) => {
              if (dropCandidate(lane.stage)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropStage(lane.key);
              }
            }}
            onDragLeave={(event) => {
              if (
                !(event.relatedTarget instanceof Node) ||
                !event.currentTarget.contains(event.relatedTarget)
              )
                setDropStage(null);
            }}
            onDrop={(event) => {
              const deal = dropCandidate(lane.stage);
              if (!deal || !lane.stage) return;
              event.preventDefault();
              dragId.current = null;
              setDropStage(null);
              requestMove(deal, lane.stage);
            }}
          >
            <header className={styles.laneHeader}>
              <div>
                <DealIcon name="stage" />
                <h2 id={`${id}-${lane.key}-title`}>{lane.name}</h2>
                <span className={styles.count}>{lane.cards.length}</span>
              </div>
              {canViewFinancials && (
                <p>
                  {lane.cards.some((deal) => deal.expected_value === null)
                    ? "Value unavailable"
                    : formatCrmCurrency(
                        lane.cards.reduce(
                          (sum, deal) => sum + (deal.expected_value ?? 0),
                          0,
                        ),
                      )}
                </p>
              )}
            </header>
            <ul className={styles.cards}>
              {lane.cards.map((deal) => (
                <li key={deal.id}>
                  <DealCard
                    deal={deal}
                    stages={destinations}
                    canMove={canMoveDeal(deal, userRole)}
                    moving={movingDealId === deal.id}
                    movePending={movingDealId !== null}
                    nowMs={now}
                    canViewFinancials={canViewFinancials}
                    onMove={requestMove}
                    onDragStart={(event) => {
                      dragId.current = deal.id;
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", deal.lead_id);
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                      setDropStage(null);
                    }}
                  />
                </li>
              ))}
            </ul>
            {!lane.cards.length && (
              <p className={styles.empty}>No deals on this page</p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
