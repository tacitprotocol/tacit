import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TACIT Protocol — Verified Identity Network',
  description: 'The trust layer the internet was built without. Verify once. Trusted everywhere.',
  openGraph: {
    title: 'TACIT Protocol',
    description: 'Cryptographic identity verification for the agent era.',
    url: 'https://app.tacitprotocol.com',
    siteName: 'TACIT Protocol',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
