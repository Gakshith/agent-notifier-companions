import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Notifier Companions',
  description:
    'Animated companions for the Agent Notifier macOS app. Browse, preview, and install in one click.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-ink-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="font-medium text-ink-200">
              Agent Notifier <span className="text-amber-accent">Companions</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-ink-400">
              <a href="/submit" className="hover:text-ink-200">Publish</a>
              <a
                href="https://github.com/Gakshith/agent-notifier"
                className="hover:text-ink-200"
              >
                Get the app
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-24 border-t border-ink-800">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-400">
            Companions are images and metadata only — never executable code.
          </div>
        </footer>
      </body>
    </html>
  );
}
