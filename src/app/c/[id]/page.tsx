import { notFound } from 'next/navigation';
import { CopyCommand } from '@/components/CopyCommand';
import { InstallButton } from '@/components/InstallButton';
import { buildCliCommand, buildInstallUrl, formatCliCommand } from '@/lib/install-url';
import { getPack, listPacks } from '@/lib/packs';

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000';

export async function generateStaticParams() {
  if (!SITE_ORIGIN.startsWith('https://')) {
    // Runs once for the whole build (generateStaticParams is called once, not per page).
    console.warn(
      `NEXT_PUBLIC_SITE_ORIGIN is not set to an https origin (got "${SITE_ORIGIN}"). ` +
        'Install links will be omitted from every detail page; only the terminal command ' +
        'will be shown, and it will point at this origin. Set NEXT_PUBLIC_SITE_ORIGIN to ' +
        'your production https domain before building for deployment.',
    );
  }
  const packs = await listPacks();
  return packs.map((pack) => ({ id: pack.id }));
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPack(id);
  if (!pack) notFound();

  // The app refuses non-https downloads, so on a local origin there is nothing
  // honest to offer: show the terminal fallback rather than a link that fails.
  const absolutePackUrl = new URL(pack.packUrl, SITE_ORIGIN).toString();
  const isHttps = absolutePackUrl.startsWith('https://');
  const installUrl = isHttps ? buildInstallUrl(absolutePackUrl) : null;
  const command = isHttps
    ? buildCliCommand(absolutePackUrl)
    : formatCliCommand(absolutePackUrl);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-xl border border-ink-800 bg-ink-900 p-10">
          <img
            src={pack.previewUrl}
            alt={`${pack.displayName} animation preview`}
            width={pack.animation.width}
            height={pack.animation.height}
            className="h-full w-full object-contain"
          />
        </div>

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-200">
            {pack.displayName}
          </h1>
          <p className="mt-2 text-ink-400">by {pack.author}</p>
          <p className="mt-6 text-lg text-ink-400">{pack.summary}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-ink-800 pt-6 text-sm">
            <div>
              <dt className="text-ink-400">Movement</dt>
              <dd className="mt-1 text-ink-200">{pack.movementStyle}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Frame rate</dt>
              <dd className="mt-1 text-ink-200">{pack.animation.fps} fps</dd>
            </div>
            <div>
              <dt className="text-ink-400">Frames</dt>
              <dd className="mt-1 text-ink-200">{pack.animation.frameCount}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Size</dt>
              <dd className="mt-1 text-ink-200">
                {pack.animation.width}×{pack.animation.height}
              </dd>
            </div>
          </dl>

          <div className="mt-8 space-y-4">
            <InstallButton installUrl={installUrl} />
            <div>
              <p className="mb-2 text-sm text-ink-400">Or install from the terminal:</p>
              <CopyCommand command={command} />
            </div>
            <p className="text-sm text-ink-400">
              Don&apos;t have the app yet?{' '}
              <a
                href="https://github.com/Gakshith/agent-notifier"
                className="text-amber-accent hover:underline"
              >
                Get Agent Notifier
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
