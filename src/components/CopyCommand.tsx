'use client';

import { useState } from 'react';

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
