import { PackCard } from '@/components/PackCard';
import { listPacks } from '@/lib/packs';

export default async function HomePage() {
  const packs = await listPacks();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="max-w-2xl">
        <h1 className="text-5xl font-semibold tracking-tight text-ink-200 sm:text-6xl">
          Give your agent <span className="text-amber-accent">a body</span>
        </h1>
        <p className="mt-6 text-lg text-ink-400">
          Animated companions for the Agent Notifier macOS app. When your coding agent
          finishes, needs you, or fails, one of these appears over your work — then gets
          out of the way.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-400">
          {packs.length} {packs.length === 1 ? 'companion' : 'companions'}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>
    </main>
  );
}
