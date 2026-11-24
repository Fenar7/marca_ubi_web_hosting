"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { FunnelBucket } from "@/types/crm";
import { updateLeadStatusInlineAction } from "@/app/actions/leadInlineActions";
import { StageTransitionModal } from "@/app/admin/components/modals/StageTransitionModal";
import type { GuardedTransitionResultPayload } from "@/app/lib/stage-transition-schemas";
import { DealsKanbanBoard } from "./DealsKanbanBoard";
import { DealsToolbar } from "./DealsToolbar";
import { DealsTable } from "./DealsTable";
import { canMoveDeal } from "./dealPresentation";
import {
  dealsFilterUrl,
  sortPageDeals,
  type DealSortField,
} from "./dealsWorkspaceModel";
import styles from "./DealsWorkspaceClient.module.scss";

/** Only authorized amounts cross the server boundary; null is unavailable/restricted, never a fabricated zero. */
export interface HydratedDealItem {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  expected_value: number | null;
  service_category?: string;
  priority: "High" | "Medium" | "Low";
  next_follow_up: string | null;
  revisit_date?: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  status_id: string;
  lead_source_id: string;
  assigned_to_name: string;
  status_name: string;
  status_bucket: "open" | "potential" | "converted" | "lost";
  status_color: string;
  source_name: string;
}
export interface FunnelStatusItem {
  id: string;
  name: string;
  sort_order: number;
  bucket: string;
  color_code: string;
  is_active?: boolean;
}
interface DealsWorkspaceClientProps {
  initialDeals: HydratedDealItem[];
  pagination?: React.ReactNode;
  lookupNotice?: string;
  sources?: { id: string; name: string }[];
  owners?: { id: string; name: string }[];
  statuses?: FunnelStatusItem[];
  userRole?: string;
  canViewFinancials?: boolean;
  canCreate?: boolean;
}

/** Query changes stay URL-owned; the local record copy changes only after confirmed mutations. */
export function DealsWorkspaceClient({
  initialDeals,
  pagination,
  lookupNotice,
  sources = [],
  owners = [],
  statuses = [],
  userRole,
  canViewFinancials = true,
  canCreate = false,
}: DealsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deals, setDeals] = useState(initialDeals);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || searchParams.get("q") || "",
  );
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedQuery = useRef<string | null>(null);
  const moveLock = useRef(false);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveNotice, setMoveNotice] = useState("");
  const [sortField, setSortField] = useState<DealSortField>("identity");
  const [sortAscending, setSortAscending] = useState(true);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [stageModalState, setStageModalState] = useState<{
    isOpen: boolean;
    leadId: string | null;
    targetStatus: { id: string; name: string; bucket: FunnelBucket } | null;
  }>({ isOpen: false, leadId: null, targetStatus: null });
  const viewMode = searchParams.get("view") === "table" ? "table" : "kanban";
  const sortedStages = useMemo(
    () => [...statuses].sort((a, b) => a.sort_order - b.sort_order),
    [statuses],
  );
  const sortedTableDeals = useMemo(
    () => sortPageDeals(deals, sortField, sortAscending),
    [deals, sortField, sortAscending],
  );

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);
  useEffect(() => {
    if (requestedQuery.current === searchParams.toString())
      requestedQuery.current = null;
    if (!searchTimer.current && requestedQuery.current === null)
      setSearchTerm(searchParams.get("search") || searchParams.get("q") || "");
  }, [searchParams]);
  useEffect(() => {
    const start = window.setTimeout(() => setNowMs(Date.now()), 0);
    const clock = window.setInterval(() => setNowMs(Date.now()), 60_000);
    function restoreHistorySearch(): void {
      requestedQuery.current = null;
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      const restored = new URLSearchParams(window.location.search);
      setSearchTerm(restored.get("search") || restored.get("q") || "");
    }
    window.addEventListener("popstate", restoreHistorySearch);
    return () => {
      window.removeEventListener("popstate", restoreHistorySearch);
      window.clearTimeout(start);
      window.clearInterval(clock);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  /** Fold changes into the latest requested query while Next resolves earlier navigations. */
  function updateFilters(changes: Record<string, string | null>): void {
    if ("search" in changes) {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      setSearchTerm(changes.search || "");
    }
    const current = new URLSearchParams(window.location.search).toString();
    const previous = requestedQuery.current ?? current;
    const next = dealsFilterUrl(previous, changes);
    const query = next.split("?")[1] ?? "";
    if (query === previous) return;
    requestedQuery.current = query === current ? null : query;
    startTransition(() =>
      router.replace(next, {
        scroll: false,
      }),
    );
  }
  function updateSearch(value: string): void {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      updateFilters({ search: value.trim() || null });
    }, 300);
  }
  function handleToggleSort(field: DealSortField, ascending?: boolean): void {
    if (ascending !== undefined) {
      setSortField(field);
      setSortAscending(ascending);
      return;
    }
    if (field === sortField) setSortAscending((value) => !value);
    else {
      setSortField(field);
      setSortAscending(true);
    }
  }

  /** Ordinary and guarded moves share server authorization; no optimistic card/count movement claims success. */
  async function handleMoveStage(
    deal: HydratedDealItem,
    destination: FunnelStatusItem,
  ): Promise<void> {
    if (
      !canMoveDeal(deal, userRole) ||
      moveLock.current ||
      stageModalState.isOpen
    )
      return;
    const target = sortedStages.find(
      (stage) => stage.id === destination.id && stage.is_active !== false,
    );
    const current = deals.find((item) => item.id === deal.id);
    if (!target || !current || current.status_id === target.id) return;
    setMoveError(null);
    setMoveNotice("");
    const targetName = target.name.trim().toLowerCase();
    if (
      target.bucket === "converted" ||
      target.bucket === "lost" ||
      targetName === "negotiation" ||
      targetName === "on hold"
    ) {
      if (
        !canViewFinancials &&
        (target.bucket === "converted" || targetName === "negotiation")
      ) {
        setMoveError(
          "A colleague with financial access must complete this stage because it requires contract valuation.",
        );
        return;
      }
      setStageModalState({
        isOpen: true,
        leadId: current.id,
        targetStatus: {
          id: target.id,
          name: target.name,
          bucket: target.bucket as FunnelBucket,
        },
      });
      return;
    }
    moveLock.current = true;
    setMovingLeadId(current.id);
    try {
      const result = await updateLeadStatusInlineAction(current.id, target.id);
      if (!result.success)
        throw new Error(result.error || "The stage change could not be saved.");
      const confirmed = result.data?.statusDetails;
      setDeals((previous) =>
        previous.map((item) =>
          item.id === current.id
            ? {
                ...item,
                status_id: confirmed?.id ?? target.id,
                status_name: confirmed?.name ?? target.name,
                status_bucket: (confirmed?.bucket ??
                  target.bucket) as FunnelBucket,
                status_color: confirmed?.color_code ?? target.color_code,
                updated_at: result.data?.updatedAt ?? item.updated_at,
              }
            : item,
        ),
      );
      setMoveNotice(
        `${current.company || current.name} moved to ${confirmed?.name ?? target.name}.`,
      );
      router.refresh();
    } catch (cause: unknown) {
      console.error(
        "[deals] Stage change failed",
        cause instanceof Error ? cause.name : "UnknownError",
      );
      setMoveError(
        cause instanceof Error
          ? cause.message
          : "Could not save the stage change. Please retry.",
      );
    } finally {
      moveLock.current = false;
      setMovingLeadId(null);
    }
  }

  /** Restricted DTOs never retain amounts returned by legacy mutation responses. */
  function handleStageTransitionSuccess(
    payload: GuardedTransitionResultPayload,
  ): void {
    const stage = sortedStages.find((item) => item.id === payload.newStatusId);
    setDeals((previous) =>
      previous.map((deal) =>
        deal.id === payload.leadId
          ? {
              ...deal,
              status_id: payload.newStatusId,
              status_name: payload.newStatusName,
              status_bucket: payload.bucket as FunnelBucket,
              status_color: stage?.color_code || deal.status_color,
              expected_value: canViewFinancials
                ? (payload.expectedValue ?? deal.expected_value)
                : null,
              updated_at: payload.updatedAt || deal.updated_at,
              next_follow_up:
                payload.nextFollowUp === undefined
                  ? deal.next_follow_up
                  : payload.nextFollowUp,
              revisit_date:
                payload.revisitDate === undefined
                  ? deal.revisit_date
                  : payload.revisitDate,
            }
          : deal,
      ),
    );
    setMoveNotice(`Moved to ${payload.newStatusName}.`);
    router.refresh();
  }

  const activeDeal = deals.find((deal) => deal.id === stageModalState.leadId);
  return (
    <div className={styles.clientContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Deals</h1>
          <p>Track opportunities and move the next conversation forward.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-new-lead-modal"))
            }
          >
            + New lead
          </button>
        )}
      </header>
      <DealsToolbar
        view={viewMode}
        search={searchTerm}
        params={searchParams.toString()}
        stages={sortedStages}
        sources={sources}
        owners={owners}
        pending={pending}
        onSearch={updateSearch}
        onChange={updateFilters}
      />
      {lookupNotice && (
        <div className={styles.notice} role="status">
          {lookupNotice}
          <button type="button" onClick={() => router.refresh()}>
            Retry details
          </button>
        </div>
      )}
      {moveError && (
        <p className={styles.error} role="alert">
          {moveError}
        </p>
      )}
      {moveNotice && (
        <p className={styles.notice} role="status">
          {moveNotice}
        </p>
      )}
      <div
        aria-busy={pending}
        className={`${styles.results} ${pending ? styles.pendingResults : ""}`}
      >
        {viewMode === "kanban" ? (
          <DealsKanbanBoard
            stages={sortedStages}
            deals={deals}
            userRole={userRole}
            movingDealId={movingLeadId}
            onMove={handleMoveStage}
            canViewFinancials={canViewFinancials}
          />
        ) : (
          <DealsTable
            deals={sortedTableDeals}
            stages={sortedStages}
            userRole={userRole}
            financial={canViewFinancials}
            sort={sortField}
            ascending={sortAscending}
            onSort={handleToggleSort}
            onMove={handleMoveStage}
            movingId={movingLeadId}
            nowMs={nowMs}
          />
        )}
      </div>
      {pagination}
      {stageModalState.isOpen &&
        stageModalState.leadId &&
        stageModalState.targetStatus && (
          <StageTransitionModal
            isOpen
            onClose={() =>
              setStageModalState({
                isOpen: false,
                leadId: null,
                targetStatus: null,
              })
            }
            leadId={stageModalState.leadId}
            targetStatus={stageModalState.targetStatus}
            dealIdCode={activeDeal?.lead_id}
            dealName={activeDeal?.company || activeDeal?.name}
            currentExpectedValue={
              canViewFinancials
                ? (activeDeal?.expected_value ?? undefined)
                : undefined
            }
            onSuccess={handleStageTransitionSuccess}
          />
        )}
    </div>
  );
}
