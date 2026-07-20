"use client";

import { useState } from "react";
import type { AcpProvider, AcpSession } from "@socra/shared-types";

import { api } from "@/lib/api";

const PROVIDER_LABEL: Record<AcpProvider, string> = {
  claude: "Claude Code",
  codex: "Codex",
};

/**
 * Pure gating rule for the modal's accept button: the student must have
 * checked the consent box, and we must not be mid-submit. Exported so it can
 * be unit-tested without rendering the component.
 */
export function canAcceptConsent(checked: boolean, submitting: boolean): boolean {
  return checked && !submitting;
}

export interface ConsentModalProps {
  open: boolean;
  provider: AcpProvider;
  accessToken: string;
  courseId?: string;
  onAccept: (session: AcpSession) => void;
  onCancel: () => void;
}

export function ConsentModal({
  open,
  provider,
  accessToken,
  courseId,
  onAccept,
  onCancel,
}: ConsentModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleAccept() {
    if (!canAcceptConsent(checked, submitting)) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.createAcpSession(
        { provider, course_id: courseId, data_collection_consent: true },
        accessToken,
      );
      onAccept(session);
    } catch {
      setError("Could not start the session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="acp-consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="acp-consent-title" className="text-lg font-semibold">
          Before you connect {PROVIDER_LABEL[provider]}
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          When you chat using your own {PROVIDER_LABEL[provider]} subscription, Socra records the
          transcript of your conversation — your prompts and the tutor&apos;s responses. We use
          these transcripts to fine-tune Socra&apos;s self-hosted tutoring model. Nothing is
          collected unless you consent below, and you can stop a bring-your-own-subscription
          session at any time.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand and consent to my {PROVIDER_LABEL[provider]} chat transcripts being
            collected for fine-tuning.
          </span>
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!canAcceptConsent(checked, submitting)}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? "Starting…" : "Accept and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
