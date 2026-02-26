'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Shield, Github, Mail, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'options' | 'email-signup' | 'email-login' | 'magic-link';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function signInWithOAuth(provider: 'google' | 'github') {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/social/callback`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {},
      },
    });
    if (error) {
      setError(error.message.includes('not enabled')
        ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is coming soon. Use email for now.`
        : error.message
      );
      setLoading(null);
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) return;
    setLoading('email-signup');
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/social/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      // Auto sign-in after signup (if email confirmation is disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Email confirmation required
        setError('Check your email to confirm your account, then sign in.');
        setLoading(null);
      } else {
        router.push('/callback');
      }
    }
  }

  async function signInWithEmail() {
    if (!email || !password) return;
    setLoading('email-login');
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Invalid email or password. Try again or create an account.'
        : error.message
      );
      setLoading(null);
    } else {
      router.push('/callback');
    }
  }

  async function sendMagicLink() {
    if (!email) return;
    setLoading('magic-link');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/social/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      setMagicLinkSent(true);
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
          <h1 className="text-2xl font-bold mb-2">
            {authMode === 'email-signup' ? 'Create your account' :
             authMode === 'email-login' ? 'Welcome back' :
             authMode === 'magic-link' ? 'Passwordless login' :
             'Join the verified network'}
          </h1>
          <p className="text-text-muted">
            {authMode === 'options'
              ? 'Mint a cryptographic identity. Your keys stay on your device.'
              : authMode === 'magic-link'
              ? 'We\'ll send a login link to your email. No password needed.'
              : 'Connect your identity to the TACIT protocol.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
            {error}
          </div>
        )}

        {/* Magic Link Sent */}
        {magicLinkSent && (
          <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-xl text-center">
            <p className="text-sm text-success font-medium mb-1">Magic link sent!</p>
            <p className="text-xs text-text-muted">Check your email and click the link to sign in.</p>
          </div>
        )}

        {/* Options Mode */}
        {authMode === 'options' && !magicLinkSent && (
          <div className="space-y-3">
            {/* Email Sign Up */}
            <button
              onClick={() => setAuthMode('email-signup')}
              className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent-bright text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              Sign up with Email
            </button>

            {/* Email Sign In */}
            <button
              onClick={() => setAuthMode('email-login')}
              className="w-full flex items-center justify-center gap-3 bg-bg-card border border-border hover:border-border-bright text-text px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              I already have an account
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg px-3 text-text-muted">or continue with</span>
              </div>
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => signInWithOAuth('google')}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Google
              </button>
              <button
                onClick={() => signInWithOAuth('github')}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 bg-bg-card border border-border hover:border-border-bright disabled:opacity-50 text-text px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                GitHub
              </button>
            </div>

            {/* Magic Link */}
            <button
              onClick={() => setAuthMode('magic-link')}
              className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-text text-sm py-2 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Use a magic link (passwordless)
            </button>
          </div>
        )}

        {/* Email Sign Up Form */}
        {authMode === 'email-signup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="Min 6 characters"
                onKeyDown={(e) => e.key === 'Enter' && signUpWithEmail()}
              />
            </div>
            <button
              onClick={signUpWithEmail}
              disabled={!email || !password || password.length < 6 || loading !== null}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              {loading === 'email-signup' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              Create Account
            </button>
            <button
              onClick={() => { setAuthMode('options'); setError(null); }}
              className="w-full text-sm text-text-muted hover:text-text transition-colors py-2"
            >
              Back to options
            </button>
          </div>
        )}

        {/* Email Login Form */}
        {authMode === 'email-login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="Your password"
                onKeyDown={(e) => e.key === 'Enter' && signInWithEmail()}
              />
            </div>
            <button
              onClick={signInWithEmail}
              disabled={!email || !password || loading !== null}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              {loading === 'email-login' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('magic-link'); setError(null); }}
              className="w-full text-sm text-text-muted hover:text-text transition-colors py-1"
            >
              Forgot password? Use a magic link
            </button>
            <button
              onClick={() => { setAuthMode('options'); setError(null); }}
              className="w-full text-sm text-text-muted hover:text-text transition-colors py-1"
            >
              Back to options
            </button>
          </div>
        )}

        {/* Magic Link Form */}
        {authMode === 'magic-link' && !magicLinkSent && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="you@example.com"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
              />
            </div>
            <button
              onClick={sendMagicLink}
              disabled={!email || loading !== null}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              {loading === 'magic-link' ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Send Magic Link
            </button>
            <button
              onClick={() => { setAuthMode('options'); setError(null); }}
              className="w-full text-sm text-text-muted hover:text-text transition-colors py-2"
            >
              Back to options
            </button>
          </div>
        )}

        {/* Info */}
        {authMode === 'options' && !magicLinkSent && (
          <div className="mt-8 p-4 bg-bg-card border border-border rounded-xl">
            <h3 className="text-sm font-medium mb-2">What happens next?</h3>
            <ul className="text-sm text-text-muted space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">1.</span>
                Create an account to start building your identity
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">2.</span>
                A cryptographic key pair is generated on your device
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">3.</span>
                Your W3C DID identity token is minted
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">4.</span>
                Start discovering and connecting with verified people
              </li>
            </ul>
          </div>
        )}

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
