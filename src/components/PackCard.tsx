import Link from 'next/link';
import type { Pack } from '@/lib/packs';

/**
 * Built-in companions ship inside the app, so the card advertises that rather
 * than implying a download the site does not offer.
 */
export function DistributionBadge({ pack }: { pack: Pack }) {
  if (pack.distribution === 'builtin') {
    return (
      <span className="rounded-full border border-teal-accent/30 bg-teal-accent/10 px-2 py-0.5 text-[11px] font-medium text-teal-accent">
        Built in
      </span>
    );
  }
  return (
    <span className="rounded-full border border-ink-700 bg-ink-950/70 px-2 py-0.5 text-[11px] font-medium text-ink-400">
      Community
    </span>
  );
}

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <Link
      href={`/c/${pack.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-colors hover:border-amber-accent-dim"
    >
      <div className="relative flex aspect-square items-center justify-center bg-ink-950 p-6">
        {/* Plain img: the preview is already sized, and static export needs no image loader. */}
        <img
          src={pack.previewUrl}
          alt={`${pack.displayName} animation preview`}
          width={pack.animation.width}
          height={pack.animation.height}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <DistributionBadge pack={pack} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-ink-800 p-4">
        <h3 className="font-medium text-ink-200 group-hover:text-amber-accent">
          {pack.displayName}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-400">{pack.summary}</p>
        <p className="mt-2 text-xs text-ink-400">
          {pack.author} · {pack.movementStyle} · {pack.animation.fps} fps
        </p>
      </div>
    </Link>
  );
}
