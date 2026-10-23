'use client';

/**
 * @file AvatarUploadModal.tsx
 * @description Interactive photo upload, square center-cropping, and deletion modal.
 *              Enforces magic-byte client processing and dispatches enterprise avatar actions.
 * @module app/admin/team/components/AvatarUploadModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { processAvatarImage, type ProcessedAvatarResult } from '@/app/lib/avatarImageProcessor';
import { updateUserAvatarAction, removeUserAvatarAction } from '@/app/actions/avatarActions';
import styles from './AvatarUploadModal.module.scss';

export interface TargetMemberAvatarContext {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: TargetMemberAvatarContext;
  onAvatarSaved: (newAvatarUrl: string | null) => void;
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  targetMember,
  onAvatarSaved,
}: AvatarUploadModalProps): React.ReactElement | null {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [processedResult, setProcessedResult] = useState<ProcessedAvatarResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Reset state on open or target change
  useEffect(() => {
    if (isOpen) {
      setProcessedResult(null);
      setErrorMessage(null);
      setIsSaving(false);
      setIsProcessing(false);
    }
  }, [isOpen, targetMember.id]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isSaving && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSaving, isProcessing, onClose]);

  if (!isOpen) return null;

  const handleFile = async (file: File): Promise<void> => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const result = await processAvatarImage(file, 512);
      setProcessedResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to process image.');
      setProcessedResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleSaveUpload = async (): Promise<void> => {
    if (!processedResult) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append(
        'avatar',
        new File([processedResult.blob], 'avatar.webp', { type: 'image/webp' })
      );

      const res = await updateUserAvatarAction(targetMember.id, formData);
      if (!res.success || !res.avatarUrl) {
        setErrorMessage(res.error || 'Failed to upload photo. Please retry.');
        setIsSaving(false);
        return;
      }

      // Notify parent component and cross-workspace listeners
      onAvatarSaved(res.avatarUrl);
      window.dispatchEvent(
        new CustomEvent('user-avatar-updated', {
          detail: { userId: targetMember.id, avatarUrl: res.avatarUrl },
        })
      );
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during avatar upload.');
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (): Promise<void> => {
    if (!targetMember.avatarUrl) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await removeUserAvatarAction(targetMember.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete photo.');
        setIsSaving(false);
        return;
      }

      onAvatarSaved(null);
      window.dispatchEvent(
        new CustomEvent('user-avatar-updated', {
          detail: { userId: targetMember.id, avatarUrl: null },
        })
      );
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during avatar deletion.');
      setIsSaving(false);
    }
  };

  const displayAvatar = processedResult?.previewUrl || targetMember.avatarUrl;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
      <div className={styles.modalContent} ref={modalContentRef}>
        <div className={styles.modalHeader}>
          <h3 id="avatar-modal-title" className={styles.modalTitle}>
            Profile Photo • {targetMember.name}
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSaving || isProcessing}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {displayAvatar ? (
            <div className={styles.previewSection}>
              <div className={styles.avatarPreviewRing}>
                <Image
                  src={displayAvatar}
                  alt={`Profile picture preview for ${targetMember.name}`}
                  fill
                  unoptimized={Boolean(processedResult?.previewUrl)}
                  sizes="128px"
                />
              </div>

              {processedResult && (
                <div className={styles.telemetryBadge}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Optimized 512×512 WebP ({(processedResult.fileSizeBytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving || isProcessing}
              >
                Choose Different Image
              </button>
            </div>
          ) : (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <svg
                className={styles.uploadIcon}
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className={styles.dropzoneText}>
                {isProcessing ? 'Processing & Cropping...' : 'Drag and drop photo here, or click to browse'}
              </p>
              <p className={styles.dropzoneSubtext}>
                JPG, PNG, or WebP • Resized to square 512×512 automatically
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </div>

        <div className={styles.modalFooter}>
          {targetMember.avatarUrl && !processedResult && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDeletePhoto}
              disabled={isSaving || isProcessing}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>{isSaving ? 'Deleting...' : 'Remove Photo'}</span>
            </button>
          )}

          <div className={styles.actionsRight}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving || isProcessing}
            >
              Cancel
            </button>

            {processedResult && (
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveUpload}
                disabled={isSaving || isProcessing}
              >
                {isSaving ? 'Saving Photo...' : 'Save & Set Photo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
