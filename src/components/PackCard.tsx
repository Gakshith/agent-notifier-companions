import Link from 'next/link';
import type { Pack } from '@/lib/packs';

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <Link
      href={`/c/${pack.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-colors hover:border-amber-accent-dim"
    >
      <div className="flex aspect-square items-center justify-center bg-ink-950 p-6">
        {/* Plain img: the preview is already sized, and static export needs no image loader. */}
        <img
          src={pack.previewUrl}
          alt={`${pack.displayName} animation preview`}
          width={pack.animation.width}
          height={pack.animation.height}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-ink-800 p-4">
        <h2 className="font-medium text-ink-200 group-hover:text-amber-accent">
          {pack.displayName}
        </h2>
        <p className="line-clamp-2 text-sm text-ink-400">{pack.summary}</p>
        <p className="mt-2 text-xs text-ink-400">
          {pack.author} · {pack.movementStyle} · {pack.animation.fps} fps
        </p>
      </div>
    </Link>
  );
}
