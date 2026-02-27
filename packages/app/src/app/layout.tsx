import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TACIT Protocol — Verified Identity Network',
  description: 'The trust layer the internet was built without. Verify once. Trusted everywhere.',
  openGraph: {
    title: 'TACIT Protocol — Verified Identity Network',
    description: 'Mint a cryptographic identity in 60 seconds. Ed25519 keys generated on your device. No passwords. No breaches.',
    url: 'https://tacitprotocol.com/social',
    siteName: 'TACIT Protocol',
    type: 'website',
    images: [
      {
        url: 'https://tacitprotocol.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TACIT Protocol — The Trust Layer for the Internet',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tacitprotocol',
    creator: '@tacitprotocol',
    title: 'TACIT Protocol — Verified Identity Network',
    description: 'Mint a cryptographic identity in 60 seconds. Ed25519 keys generated on your device.',
    images: ['https://tacitprotocol.com/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
