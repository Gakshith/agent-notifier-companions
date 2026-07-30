import { MIN_APP_VERSION } from '@/lib/install-url';

export function InstallButton({ installUrl }: { installUrl: string | null }) {
  if (installUrl === null) {
    return (
      <p className="rounded-lg border border-ink-800 bg-ink-900 p-4 text-sm text-ink-400">
        One-click install needs the site to be served over https. Use the terminal
        command below instead.
      </p>
    );
  }

  return (
    <div>
      <a
        href={installUrl}
        className="inline-flex items-center justify-center rounded-lg bg-amber-accent px-5 py-3 font-medium text-ink-950 transition-opacity hover:opacity-90"
      >
        Install companion
      </a>
      <p className="mt-2 text-xs text-ink-400">
        Opens Agent Notifier, which previews the companion and asks you to confirm before
        installing. Requires Agent Notifier {MIN_APP_VERSION} or newer.
      </p>
    </div>
  );
}
