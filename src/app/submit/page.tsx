export const metadata = {
  title: 'Publish a companion — Agent Notifier Companions',
};

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-ink-200">
        Publish a companion
      </h1>
      <p className="mt-6 text-lg text-ink-400">
        Creator accounts and uploads are not open yet. The pack format below is stable,
        so anything you build now will be publishable when they are.
      </p>

      <section className="mt-12 rounded-xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="font-medium text-ink-200">What a companion is</h2>
        <p className="mt-3 text-ink-400">
          A folder of transparent PNG frames plus a small JSON manifest describing the
          frame rate, size, and how it moves. No code, ever — which is why installing one
          cannot run anything on your machine. See the full{' '}
          <a
            href="https://github.com/Gakshith/agent-notifier-companions/blob/main/docs/pack-format.md"
            className="text-amber-accent hover:underline"
          >
            pack format
          </a>{' '}
          for the manifest schema, id rules, frame naming, and checksums.
        </p>
        {/* Deliberately not linking to the app repo's companion-packs.md: that document
            describes manifest v1, under which community packs are not loadable at all.
            We link to this repository's own docs/pack-format.md instead, which describes
            the v2 rules this site actually enforces. Summarise those rules below too. */}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-ink-400">Frames</dt>
            <dd className="mt-1 text-ink-200">1–96 transparent PNGs</dd>
          </div>
          <div>
            <dt className="text-ink-400">Frame size</dt>
            <dd className="mt-1 text-ink-200">16–512 px per side</dd>
          </div>
          <div>
            <dt className="text-ink-400">Frame rate</dt>
            <dd className="mt-1 text-ink-200">1–24 fps</dd>
          </div>
          <div>
            <dt className="text-ink-400">Movement</dt>
            <dd className="mt-1 text-ink-200">airborne, grounded, or hovering</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-ink-200">What is coming</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-400">
          <li>Sign in and publish a pack you built locally.</li>
          <li>A creator page collecting everything you have published.</li>
          <li>Review before anything appears publicly.</li>
        </ul>
      </section>
    </main>
  );
}
