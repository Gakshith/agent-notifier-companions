import Link from 'next/link';
import { PackCard } from '@/components/PackCard';
import { listPacks, partitionPacks, type Pack } from '@/lib/packs';

function SectionHeading({
  title,
  count,
  blurb,
}: {
  title: string;
  count: number;
  blurb: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-ink-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink-200">{title}</h2>
        <p className="mt-1 text-sm text-ink-400">{blurb}</p>
      </div>
      <span className="shrink-0 text-sm text-ink-400">
        {count} {count === 1 ? 'companion' : 'companions'}
      </span>
    </div>
  );
}

/**
 * The hero leads with a real companion rather than an illustration, so the first
 * thing a visitor sees is the actual artwork the app renders. Built-ins come
 * first because they are the flagship animations; if none exist the hero simply
 * drops the visual rather than shipping a broken image.
 */
function HeroPreview({ pack }: { pack: Pack | undefined }) {
  if (!pack) return null;
  return (
    <div className="relative hidden lg:block">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-amber-accent/10 blur-3xl"
      />
      <img
        src={pack.previewUrl}
        alt={`${pack.displayName} animation preview`}
        width={pack.animation.width}
        height={pack.animation.height}
        className="mx-auto h-72 w-72 object-contain"
      />
    </div>
  );
}

export default async function HomePage() {
  const packs = await listPacks();
  const { builtin, community } = partitionPacks(packs);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-ink-800 bg-ink-900 px-3 py-1 text-xs text-ink-400">
            For Claude Code, Codex, and any agent that can run a command
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-ink-200 sm:text-6xl">
            Give your agent <span className="text-amber-accent">a body</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-400">
            Animated companions for the Agent Notifier macOS app. When your coding agent
            finishes, needs you, or fails, one of these appears over your work — then gets
            out of the way. No dock icon, no stolen focus, no telemetry.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="https://github.com/Gakshith/agent-notifier"
              className="inline-flex items-center justify-center rounded-lg bg-amber-accent px-5 py-3 font-medium text-ink-950 transition-opacity hover:opacity-90"
            >
              Get Agent Notifier
            </a>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg border border-ink-700 px-5 py-3 font-medium text-ink-200 transition-colors hover:border-amber-accent-dim"
            >
              Publish a companion
            </Link>
          </div>
        </div>
        <HeroPreview pack={builtin[0]} />
      </section>

      {builtin.length > 0 && (
        <section className="mt-24">
          <SectionHeading
            title="Built in"
            count={builtin.length}
            blurb="Ships inside the app. Nothing to install — pick one from the menu bar."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {builtin.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>
      )}

      {community.length > 0 && (
        <section className="mt-20">
          <SectionHeading
            title="Community"
            count={community.length}
            blurb="Installable packs. Images and metadata only — never executable code."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {community.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
