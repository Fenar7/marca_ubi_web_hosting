"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { AvatarUploadModal } from "@/app/admin/(workspace)/team/components/AvatarUploadModal";
import type { CurrentUserSession } from "@/types/crm";
import { isTabAuthorized } from "./navigationConfig";
import styles from "./UserProfileDropdown.module.scss";
export type { CurrentUserSession };

interface UserProfileDropdownProps {
  currentUser: CurrentUserSession;
  compact?: boolean;
  placement?: "above" | "below";
}

/** Account actions remain available in restricted workspaces without advertising forbidden settings routes. */
export function UserProfileDropdown({
  currentUser,
  compact = false,
  placement = "below",
}: UserProfileDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const avatarLayer = useRef<HTMLDivElement>(null);
  const name = currentUser.name || currentUser.fullName || "Account";
  const role = currentUser.role.replaceAll("_", " ");
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (
        event as CustomEvent<{ userId: string; avatarUrl: string | null }>
      ).detail;
      if (detail?.userId === currentUser.id) setAvatarUrl(detail.avatarUrl);
    };
    window.addEventListener("user-avatar-updated", update);
    return () => window.removeEventListener("user-avatar-updated", update);
  }, [currentUser.id]);

  // The body portal escapes the transformed mobile drawer; this scope owns focus until upload closes.
  useEffect(() => {
    if (!avatarOpen) return;
    const layer = avatarLayer.current;
    const returnFocus = trigger.current;
    if (!layer) return;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const controls = () =>
      Array.from(layer.querySelectorAll<HTMLElement>(selector)).filter(
        (element) => element.getClientRects().length > 0,
      );
    controls()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const available = controls();
      const first = available[0];
      const last = available[available.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !layer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !layer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [avatarOpen]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  /** Do not claim logout succeeded when invalidation fails; retain a visible retry in the current session. */
  async function signOut(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await logoutAction();
      if (!result.success) {
        setError("Could not sign out. Please try again.");
        setPending(false);
        return;
      }
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.removeAttribute("data-admin-route");
      window.location.assign(result?.redirectTo || "/admin/login");
    } catch (cause: unknown) {
      console.error(
        "[account] Sign-out request failed",
        cause instanceof Error ? cause.name : "UnknownError",
      );
      setError("Could not sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div
      ref={container}
      className={`${styles.container} ${compact ? styles.compact : ""}`}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.userTrigger}
        aria-expanded={open}
        aria-label={compact ? `Account: ${name}, ${role}` : undefined}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.triggerAvatar} aria-hidden="true">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={30} height={30} unoptimized />
          ) : (
            initials
          )}
        </span>
        {!compact && (
          <span className={styles.identity}>
            <span>{name}</span>
            <small>{role}</small>
          </span>
        )}
        <span className={styles.chevron} aria-hidden="true">
          ⌃
        </span>
      </button>
      {open && (
        <div
          className={`${styles.dropdownMenu} ${placement === "above" ? styles.above : ""}`}
          role="group"
          aria-label="Account actions"
        >
          <div className={styles.identityHeader}>
            <strong>{name}</strong>
            <span className={styles.userEmail}>{currentUser.email}</span>
          </div>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              setAvatarOpen(true);
            }}
          >
            Update profile photo
          </button>
          {isTabAuthorized("settings", currentUser) && (
            <Link
              className={styles.menuItem}
              href="/admin/settings"
              onClick={() => setOpen(false)}
            >
              Workspace settings
            </Link>
          )}
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
          >
            Search or navigate
          </button>
          <div className={styles.divider} />
          <form onSubmit={signOut}>
            <button
              type="submit"
              className={styles.signOutButton}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </form>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </div>
      )}
      {avatarOpen &&
        createPortal(
          <div
            ref={avatarLayer}
            data-account-avatar-layer="true"
            data-admin-root="true"
          >
            <AvatarUploadModal
              isOpen
              targetMember={{ id: currentUser.id, name, avatarUrl }}
              onClose={() => {
                setAvatarOpen(false);
                trigger.current?.focus();
              }}
              onAvatarSaved={setAvatarUrl}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
