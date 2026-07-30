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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
