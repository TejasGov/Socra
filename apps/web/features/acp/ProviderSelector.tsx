"use client";

import type { AcpUiProvider } from "./types";

const OPTIONS: Array<{ value: AcpUiProvider; label: string; description: string }> = [
  {
    value: "hosted",
    label: "Socra hosted",
    description: "Self-hosted Gemma model. No setup required.",
  },
  {
    value: "claude",
    label: "Claude",
    description: "Bring your own Claude Code subscription.",
  },
  {
    value: "codex",
    label: "Codex",
    description: "Bring your own Codex (OpenAI) subscription.",
  },
];

export interface ProviderSelectorProps {
  value: AcpUiProvider;
  onChange: (provider: AcpUiProvider) => void;
}

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tutoring provider"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              selected
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            }`}
          >
            <div className="font-medium">{option.label}</div>
            <div
              className={`mt-1 text-xs ${
                selected ? "text-zinc-200 dark:text-zinc-700" : "text-zinc-500"
              }`}
            >
              {option.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
