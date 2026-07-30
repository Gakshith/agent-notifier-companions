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
          cannot run anything on your machine.
        </p>
        <a
          href="https://github.com/Gakshith/agent-notifier/blob/main/docs/companion-packs.md"
          className="mt-4 inline-block text-amber-accent hover:underline"
        >
          Read the pack format
        </a>
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
