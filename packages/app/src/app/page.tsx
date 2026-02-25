import Link from 'next/link';
import { Shield, Fingerprint, Users, ArrowRight, Lock, Globe, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <span className="font-bold text-lg">TACIT</span>
          </div>
          <Link
            href="/login"
            className="bg-accent hover:bg-accent-bright text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-bright px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Lock className="w-3.5 h-3.5" />
            Trusted Agent Cryptographic Identity Tokens
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Verify once.
            <br />
            <span className="text-accent-bright">Trusted everywhere.</span>
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Your identity should be cryptographic, portable, and unforgeable.
            No passwords. No breaches. Just a key pair that proves you are you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors"
            >
              Create Your Identity
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://tacitprotocol.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 border border-border hover:border-border-bright text-text px-8 py-3.5 rounded-xl text-lg font-medium transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-danger mb-2">68%</div>
            <div className="text-text-muted">of data breaches involve human identity</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-warning mb-2">$10B+</div>
            <div className="text-text-muted">lost to identity fraud annually</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-bright mb-2">100+</div>
            <div className="text-text-muted">passwords the avg person manages</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Mint your identity in under 3 minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Accounts</h3>
              <p className="text-text-muted">
                Sign in with Google, GitHub, or LinkedIn. Each connection proves
                part of your real identity and adds to your trust score.
              </p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Fingerprint className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mint Your Identity</h3>
              <p className="text-text-muted">
                An Ed25519 key pair is generated on your device. Your private key
                never leaves your browser. A W3C DID is created as your
                cryptographic identity.
              </p>
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Matched</h3>
              <p className="text-text-muted">
                Publish intents — what you&apos;re looking for. The protocol matches
                you with verified people who complement your goals. Progressive
                reveal protects your privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            The Exclusive Network
          </h2>
          <p className="text-text-muted text-center max-w-2xl mx-auto mb-16">
            A verified-only social layer where every person is cryptographically proven.
            No bots. No catfish. No scammers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: 'Verified Networking',
                desc: 'Every user has a cryptographic identity with a trust score. LinkedIn but everyone is actually verified.',
              },
              {
                icon: Zap,
                title: 'Agent-Brokered Intros',
                desc: 'Your AI agent finds compatible connections. Double opt-in at every stage. No cold outreach.',
              },
              {
                icon: Lock,
                title: 'Progressive Reveal',
                desc: 'Start anonymous. Reveal your identity in stages only when both parties consent.',
              },
              {
                icon: Fingerprint,
                title: 'Trust Compounds',
                desc: 'Your trust score grows over time. Verified behavior, attestations, and network effects make your identity more valuable.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-xl border border-border hover:border-border-bright transition-colors">
                <Icon className="w-6 h-6 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-text-muted text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to own your identity?</h2>
          <p className="text-text-muted mb-8">
            Join the first verified-only network on the internet. Early adopters get Pioneer status.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-bright text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors"
          >
            Create Your Identity
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            TACIT Protocol
          </div>
          <div className="flex gap-6">
            <a href="https://tacitprotocol.com" target="_blank" rel="noopener" className="hover:text-text transition-colors">Website</a>
            <a href="https://github.com/tacitprotocol" target="_blank" rel="noopener" className="hover:text-text transition-colors">GitHub</a>
            <a href="https://x.com/tacitprotocol" target="_blank" rel="noopener" className="hover:text-text transition-colors">X</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
