'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Github, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  async function signInWith(provider: 'google' | 'github') {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {},
      },
    });
    if (error) {
      console.error('Auth error:', error);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold">TACIT</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create your identity</h1>
          <p className="text-text-muted">
            Connect your existing accounts to mint a cryptographic identity.
            No passwords. Your keys stay on your device.
          </p>
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          <button
            onClick={() => signInWith('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3.5 rounded-xl font-medium transition-colors"
          >
            {loading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          <button
            onClick={() => signInWith('github')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-bg-card border border-border hover:border-border-bright disabled:opacity-50 disabled:cursor-not-allowed text-text px-5 py-3.5 rounded-xl font-medium transition-colors"
          >
            {loading === 'github' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            Continue with GitHub
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium mb-2">What happens next?</h3>
          <ul className="text-sm text-text-muted space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">1.</span>
              Sign in with your accounts to prove your identity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">2.</span>
              A cryptographic key pair is generated on your device
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">3.</span>
              Your trust score is calculated from your verified accounts
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">4.</span>
              Start discovering and connecting with verified people
            </li>
          </ul>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          By continuing, you agree to the{' '}
          <a href="https://tacitprotocol.com" className="underline hover:text-text">
            TACIT Protocol terms
          </a>
        </p>
      </div>
    </div>
  );
}
