"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type {
  FunnelStatusItem,
  HydratedDealItem,
} from "./DealsWorkspaceClient";
import { allowedMoveDestinations, dealIdentity } from "./dealPresentation";
import { DealIcon } from "./DealIcon";
import styles from "./DealActionsMenu.module.scss";

interface DealActionsMenuProps {
  deal: HydratedDealItem;
  stages: FunnelStatusItem[];
  canMove: boolean;
  moving: boolean;
  disabled?: boolean;
  onMove: (deal: HydratedDealItem, stage: FunnelStatusItem) => void;
}

/** One native modal owns focus and escapes lane clipping; movement always requires explicit confirmation. */
export function DealActionsMenu({
  deal,
  stages,
  canMove,
  moving,
  disabled,
  onMove,
}: DealActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"actions" | "move">("actions");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [position, setPosition] = useState({ top: 80, left: 20 });
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const moveSearch = useRef<HTMLInputElement>(null);
  const moveAction = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const title = dealIdentity(deal).title;
  const destinations = allowedMoveDestinations(stages).filter(
    (stage) => stage.id !== deal.status_id,
  );
  const destination = destinations.find((stage) => stage.id === selected);
  const phone = deal.phone?.replace(/\D/g, "") ?? "";
  const tel = deal.phone?.trim().startsWith("+") ? `+${phone}` : phone;

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const reposition = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      setPosition({
        left: Math.max(
          12,
          Math.min((bounds?.right ?? 332) - 320, window.innerWidth - 332),
        ),
        top: Math.max(
          12,
          Math.min(
            (bounds?.bottom ?? 72) + 6,
            window.innerHeight - Math.min(500, window.innerHeight - 24),
          ),
        ),
      });
    };
    reposition();
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("resize", reposition);
      element.close();
    };
  }, [open]);

  useEffect(() => {
    if (open && mode === "move") moveSearch.current?.focus();
  }, [mode, open]);

  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }

  /** Clipboard failure stays in the action surface and cannot masquerade as a successful copy. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(deal.lead_id);
      setNotice(`Copied ${deal.lead_id}`);
    } catch (error: unknown) {
      console.error(
        "[deal-actions] Copy failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      setNotice("Could not copy. Select the reference in the deal details.");
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={`Actions for ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={moving || disabled}
        onClick={() => {
          setMode("actions");
          setQuery("");
          setNotice("");
          setOpen(true);
        }}
      >
        <DealIcon name="more" />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.dialog}
            style={{ top: position.top, left: position.left }}
            aria-labelledby={titleId}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={(event) => {
              if (event.target === dialog.current) {
                const rect = event.currentTarget.getBoundingClientRect();
                if (
                  event.clientX < rect.left ||
                  event.clientX > rect.right ||
                  event.clientY < rect.top ||
                  event.clientY > rect.bottom
                )
                  close();
              }
            }}
          >
            <div className={styles.heading}>
              <div>
                <h2 id={titleId}>
                  {mode === "move" ? "Move to stage" : "Deal actions"}
                </h2>
                <p>{title}</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={close}
                aria-label="Close deal actions"
              >
                <DealIcon name="close" />
              </button>
            </div>
            {mode === "actions" ? (
              <div className={styles.actions}>
                <Link
                  href={`/admin/deals/${encodeURIComponent(deal.id)}`}
                  prefetch={false}
                >
                  <DealIcon name="arrow" />
                  Open deal
                </Link>
                {canMove && destinations.length > 0 && (
                  <button
                    ref={moveAction}
                    type="button"
                    onClick={() => setMode("move")}
                  >
                    <DealIcon name="stage" />
                    Move to stage
                  </button>
                )}
                <button type="button" onClick={() => void copy()}>
                  <DealIcon name="copy" />
                  Copy reference <span>{deal.lead_id}</span>
                </button>
                {phone.length >= 7 && (
                  <>
                    <a href={`tel:${tel}`}>
                      <DealIcon name="phone" />
                      Call contact
                    </a>
                    <a
                      href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${deal.name}, regarding ${deal.lead_id} with Marca Ubi.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DealIcon name="message" />
                      WhatsApp contact
                    </a>
                  </>
                )}
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!destination || !canMove || moving || disabled) return;
                  close();
                  onMove(deal, destination);
                }}
              >
                <p className={styles.current}>
                  Current stage: <strong>{deal.status_name}</strong>
                </p>
                <label className={styles.search}>
                  <DealIcon name="search" />
                  <span className={styles.srOnly}>Find destination stage</span>
                  <input
                    ref={moveSearch}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a stage…"
                    maxLength={100}
                  />
                </label>
                <fieldset className={styles.destinations}>
                  <legend className={styles.srOnly}>Destination stage</legend>
                  {destinations
                    .filter((stage) =>
                      stage.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((stage) => (
                      <label
                        key={stage.id}
                        className={selected === stage.id ? styles.selected : ""}
                      >
                        <input
                          type="radio"
                          name={titleId}
                          value={stage.id}
                          checked={selected === stage.id}
                          onChange={() => setSelected(stage.id)}
                        />
                        <span>{stage.name}</span>
                        {selected === stage.id && <DealIcon name="check" />}
                      </label>
                    ))}
                  {!destinations.some((stage) =>
                    stage.name.toLowerCase().includes(query.toLowerCase()),
                  ) && <p>No matching stages.</p>}
                </fieldset>
                <div className={styles.footer}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("actions");
                      window.requestAnimationFrame(() =>
                        moveAction.current?.focus(),
                      );
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!destination || moving || disabled}
                  >
                    {destination
                      ? `${destination.bucket === "converted" || destination.bucket === "lost" || ["on hold", "negotiation"].includes(destination.name.trim().toLowerCase()) ? "Continue to" : "Move to"} ${destination.name}`
                      : "Choose a stage"}
                  </button>
                </div>
              </form>
            )}
            {notice && (
              <p className={styles.notice} role="status">
                {notice}
              </p>
            )}
          </dialog>,
          document.body,
        )}
    </>
  );
}
