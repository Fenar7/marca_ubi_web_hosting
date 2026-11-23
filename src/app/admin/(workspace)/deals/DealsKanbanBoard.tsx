'use client';

import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import { calculateOverdueTier } from '@/app/admin/components/Badges/badgeUtils';
import type { FunnelStatusItem, HydratedDealItem } from './DealsWorkspaceClient';
import styles from './DealsKanbanBoard.module.scss';

interface DealsKanbanBoardProps {
  stages: FunnelStatusItem[];
  deals: HydratedDealItem[];
  userRole?: string;
  movingDealId: string | null;
  onMove: (deal: HydratedDealItem, stage: FunnelStatusItem) => void;
}

const dealDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Guarded actions resolve named or terminal destinations through a single-row catalog query. */
function moveDestinations(stages: FunnelStatusItem[]) {
  return stages.filter((stage) => {
    if (stage.is_active === false) return false;
    if (stage.bucket === 'converted' || stage.bucket === 'lost') {
      return stages.filter((candidate) => candidate.bucket === stage.bucket).length === 1;
    }
    if (stage.name.trim().toLowerCase() === 'negotiation') {
      return stages.filter((candidate) => candidate.name.trim().toLowerCase() === 'negotiation').length === 1;
    }
    return true;
  });
}

/** Keep hover/drop state local so only a card picked up in this board can initiate a stage move. */
export function DealsKanbanBoard({ stages, deals, userRole, movingDealId, onMove }: DealsKanbanBoardProps) {
  const boardId = useId();
  const board = useRef<HTMLDivElement>(null);
  const stagePicker = useRef<HTMLSelectElement>(null);
  const dragId = useRef<string | null>(null);
  const requestedMove = useRef<{ dealId: string; to: string } | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const canMove = userRole === 'admin' || userRole === 'sales_manager' || userRole === 'sales_executive';
  const canMoveDeal = (deal: HydratedDealItem) => canMove && (userRole === 'admin' || deal.status_bucket !== 'converted');
  const byStage = new Map<string, HydratedDealItem[]>();
  const stageIds = new Set(stages.map((stage) => stage.id));
  const unmatchedDeals: HydratedDealItem[] = [];

  for (const deal of deals) {
    if (!stageIds.has(deal.status_id)) {
      unmatchedDeals.push(deal);
      continue;
    }
    const stageDeals = byStage.get(deal.status_id);
    if (stageDeals) stageDeals.push(deal);
    else byStage.set(deal.status_id, [deal]);
  }

  // A missing catalogue entry must not make a loaded deal disappear from the board.
  const destinations = moveDestinations(stages);
  const destinationIds = new Set(destinations.map((stage) => stage.id));
  const lanes = stages.filter((stage) => stage.is_active !== false || byStage.has(stage.id)).map((stage) => ({
    key: stage.id,
    title: stage.name,
    color: /^#[0-9a-f]{6}$/i.test(stage.color_code) ? stage.color_code : '#686863',
    stage,
    cards: byStage.get(stage.id) ?? [],
  }));
  const visibleLanes = unmatchedDeals.length
    ? [...lanes, { key: 'unlisted', title: 'Other stages', color: '#686863', stage: null, cards: unmatchedDeals }]
    : lanes;
  const activeLane = visibleLanes.find((lane) => lane.key === selectedStage)?.key
    ?? visibleLanes.find((lane) => lane.cards.length > 0)?.key
    ?? visibleLanes[0]?.key;

  useEffect(() => {
    // The clock is absent during SSR so overdue labels cannot differ at hydration.
    const initial = window.setTimeout(() => setNowMs(Date.now()), 0);
    const ticker = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(ticker);
    };
  }, []);

  useEffect(() => {
    const move = requestedMove.current;
    if (!move || deals.find((deal) => deal.id === move.dealId)?.status_id !== move.to) return;
    requestedMove.current = null;

    // Use the committed destination, then recover focus if the previous card was remounted.
    const afterCommit = window.requestAnimationFrame(() => {
      setSelectedStage(move.to);
      if (document.activeElement === document.body) stagePicker.current?.focus();
    });
    return () => window.cancelAnimationFrame(afterCommit);
  }, [deals]);

  function requestMove(deal: HydratedDealItem, stage: FunnelStatusItem) {
    requestedMove.current = { dealId: deal.id, to: stage.id };
    onMove(deal, stage);
  }

  /** Check both the loaded record and stage at drop time since filters may change mid-gesture. */
  function allowedDrop(stage: FunnelStatusItem | null) {
    if (!stage || !destinationIds.has(stage.id) || !dragId.current || !canMove || movingDealId !== null) return null;
    return deals.find((deal) => deal.id === dragId.current && deal.status_id !== stage.id && canMoveDeal(deal)) ?? null;
  }

  function resetDrag() {
    dragId.current = null;
    setDropStage(null);
  }

  function jumpToLane(key: string) {
    setSelectedStage(key);
    const rail = board.current;
    const lane = rail?.children.namedItem(`${boardId}-${key}`);
    if (lane && rail && lane.getClientRects().length) {
      rail.scrollLeft += lane.getBoundingClientRect().left - rail.getBoundingClientRect().left;
    }
  }

  /** Clipboard errors remain visible when permissions or the browser prevent copying. */
  async function copyRef(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      setCopyFeedback(`Copied ${reference}`);
    } catch {
      setCopyFeedback(`Could not copy ${reference}`);
    }
  }

  if (!visibleLanes.length) return <p className={styles.empty}>No pipeline stages are available.</p>;

  return (
    <section className={styles.board} aria-label="Deals board">
      <div className={styles.navigator}>
        <label className={styles.jump}>
          <span>Stage</span>
          <select ref={stagePicker} value={activeLane} onChange={(event) => jumpToLane(event.currentTarget.value)}>
            {visibleLanes.map((lane) => (
              <option key={lane.key} value={lane.key}>{lane.title} ({lane.cards.length})</option>
            ))}
          </select>
        </label>
        <span className={styles.scope}>Counts and values reflect the deals shown on this page.</span>
        <span role="status" className={styles.feedback}>{copyFeedback}</span>
      </div>
      <div ref={board} className={styles.lanes} role="region" aria-label="Pipeline stages" tabIndex={0}>
        {visibleLanes.map(({ key, title, color, stage, cards }) => (
          <section
            key={key}
            id={`${boardId}-${key}`}
            data-active={activeLane === key}
            data-drop={dropStage === key}
            className={styles.lane}
            aria-labelledby={`${boardId}-${key}-title`}
            onDragOver={(event) => {
              if (!allowedDrop(stage)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropStage(key);
            }}
            onDragLeave={(event) => {
              if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
              setDropStage((current) => current === key ? null : current);
            }}
            onDrop={(event) => {
              const deal = allowedDrop(stage);
              if (!deal || !stage) return;
              event.preventDefault();
              resetDrag();
              requestMove(deal, stage);
            }}
          >
            <header className={styles.laneHeader}>
              <div className={styles.laneTitle}>
                <span className={styles.marker} style={{ backgroundColor: color }} aria-hidden="true" />
                <h2 id={`${boardId}-${key}-title`}>{title}</h2>
                <span className={styles.count}>{cards.length}</span>
              </div>
              <p className={styles.total}>{formatCrmCurrency(cards.reduce((sum, card) => sum + card.expected_value, 0))}</p>
            </header>
            <ul className={styles.cards}>
              {cards.map((deal) => (
                <li key={deal.id}>
                  <DealCard
                    deal={deal}
                    stages={destinations}
                    canMove={canMoveDeal(deal)}
                    movePending={movingDealId !== null}
                    moving={movingDealId === deal.id}
                    nowMs={nowMs}
                    onCopy={copyRef}
                    onMove={requestMove}
                    onDragStart={(event) => {
                      dragId.current = deal.id;
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', deal.lead_id);
                    }}
                    onDragEnd={resetDrag}
                  />
                </li>
              ))}
            </ul>
            {cards.length === 0 && <p className={styles.empty}>No deals in this stage</p>}
          </section>
        ))}
      </div>
    </section>
  );
}

interface DealCardProps {
  deal: HydratedDealItem;
  stages: FunnelStatusItem[];
  canMove: boolean;
  movePending: boolean;
  moving: boolean;
  nowMs: number | null;
  onCopy: (reference: string) => Promise<void>;
  onMove: DealsKanbanBoardProps['onMove'];
  onDragStart: (event: DragEvent<HTMLSpanElement>) => void;
  onDragEnd: () => void;
}

/** Explicit submission keeps keyboard navigation in the stage picker from changing a deal. */
function DealCard({ deal, stages, canMove, movePending, moving, nowMs, onCopy, onMove, onDragStart, onDragEnd }: DealCardProps) {
  const [target, setTarget] = useState('');
  const destination = stages.find((stage) => stage.id === target && stage.id !== deal.status_id);
  const title = deal.company || deal.name;
  const due = deal.next_follow_up ? new Date(deal.next_follow_up) : null;
  const hasDue = due !== null && Number.isFinite(due.getTime());
  const overdue = nowMs === null ? null : calculateOverdueTier(deal.next_follow_up, {
    bucket: deal.status_bucket,
    statusName: deal.status_name,
    revisitDate: deal.revisit_date,
    nowMs,
  });
  const phone = deal.phone?.replace(/\D/g, '') ?? '';
  const tel = deal.phone?.trim().startsWith('+') ? `+${phone}` : phone;
  const message = encodeURIComponent(`Hello ${deal.name}, this is regarding your deal with Marca Ubi (Ref: ${deal.lead_id}).`);
  const movable = canMove && stages.some((stage) => stage.id !== deal.status_id);

  function handleMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!destination || movePending) return;
    setTarget('');
    onMove(deal, destination);
  }

  return (
    <article className={styles.card} aria-label={`${title}, ${deal.lead_id}`} aria-busy={moving}>
      <div className={styles.cardTop}>
        {movable && <span
          className={styles.grip}
          draggable={!movePending}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="Drag to another stage"
          aria-hidden="true"
        >
          <svg width="14" height="18" viewBox="0 0 16 20" fill="currentColor">
            <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="10" r="1.2" /><circle cx="11" cy="10" r="1.2" />
            <circle cx="5" cy="16" r="1.2" /><circle cx="11" cy="16" r="1.2" />
          </svg>
        </span>}
        <button type="button" onClick={() => void onCopy(deal.lead_id)} className={styles.reference} aria-label={`Copy ${deal.lead_id}`}>{deal.lead_id}</button>
        <span className={styles.priority} data-priority={deal.priority.toLowerCase()} aria-label={`${deal.priority} priority`}>{deal.priority}</span>
      </div>
      <h3 className={styles.cardTitle}>
        <Link href={`/admin/deals/${encodeURIComponent(deal.id)}`} prefetch={false}>{title}</Link>
      </h3>
      {deal.company && deal.name !== deal.company && <p className={styles.contact}>{deal.name}</p>}
      <p className={styles.value}>{formatCrmCurrency(deal.expected_value)}</p>
      <dl className={styles.details}>
        <div><dt>Owner</dt><dd>{deal.assigned_to_name || (deal.assigned_to ? 'Owner unavailable' : 'Unassigned')}</dd></div>
        <div><dt>Follow-up</dt><dd>
          {hasDue ? <time dateTime={due.toISOString()}>{dealDate.format(due)}</time> : 'Not scheduled'}
          {overdue?.isOverdue && <span className={styles.overdue}>{overdue.shortLabel}</span>}
        </dd></div>
      </dl>
      {phone.length >= 7 && <div className={styles.contactActions}>
        <a href={`tel:${tel}`} aria-label={`Call ${deal.name}`}>Call</a>
        <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${deal.name} on WhatsApp`}>WhatsApp</a>
      </div>}
      {movable && (
        <form className={styles.move} onSubmit={handleMove} aria-label={`Move ${deal.lead_id} to stage`}>
          <select aria-label={`Destination stage for ${deal.lead_id}`} value={destination?.id ?? ''} onChange={(event) => setTarget(event.currentTarget.value)} disabled={movePending}>
            <option value="">Move to stage</option>
            {stages.filter((stage) => stage.id !== deal.status_id).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select>
          <button type="submit" disabled={!destination || movePending}>{moving ? 'Moving...' : 'Move'}</button>
        </form>
      )}
    </article>
  );
}
