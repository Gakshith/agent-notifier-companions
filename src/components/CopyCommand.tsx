'use client';

import { useState } from 'react';

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // On a non-secure origin (plain http), navigator.clipboard is undefined; on some
    // browsers writeText can also reject (permission denied). Either way the command
    // text stays visible and selectable, so failing here silently is fine.
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — button just does nothing, no dead unhandled rejection
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-800 bg-ink-900 p-3">
      <code className="flex-1 overflow-x-auto whitespace-nowrap text-sm text-ink-200">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md border border-ink-700 px-3 py-1 text-sm text-ink-200 hover:border-amber-accent-dim"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
