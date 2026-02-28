'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IndexedDBBackend } from '@/lib/tacit/indexed-db-backend';
import {
  createTacitIdentity,
  serializeIdentity,
  type TacitIdentity,
} from '@/lib/tacit/identity';
import {
  Shield,
  Fingerprint,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Github,
  Mail,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

type Step = 'profile' | 'minting' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('profile');
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null>(null);
  const [identity, setIdentity] = useState<TacitIdentity | null>(null);
  const [trustScore, setTrustScore] = useState(10);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seeking, setSeeking] = useState('');
  const [offering, setOffering] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      // Check if user already completed onboarding — prevent re-minting
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile?.onboarding_complete) {
        router.replace('/dashboard');
        return;
      }

      setUser(user);

      // Extract connected providers from user metadata
      const providers: string[] = [];
      const provider = user.app_metadata?.provider;
      if (provider && provider !== 'email') {
        providers.push(provider as string);
      }
      setConnectedProviders(providers);

      // Set default display name
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Tacit User';
      setDisplayName(name as string);

      // Client-side trust score preview only — the authoritative score is
      // calculated in mintIdentity() and written to the DB via Supabase RLS.
      // SECURITY: Add a DB trigger or RLS policy to recalculate trust_score
      // on insert/update so clients cannot spoof scores via dev tools.
      const platformScore = providers.length * 15;
      const emailScore = user.email ? 10 : 0;
      setTrustScore(Math.min(10 + platformScore + emailScore, 100));
    }
    init();
  }, [router, supabase]);

  async function mintIdentity() {
    if (!user || !displayName.trim()) return;
    setStep('minting');
    setError(null);

    try {
      // Generate Ed25519 key pair on-device
      const newIdentity = await createTacitIdentity();
      setIdentity(newIdentity);

      // Store private key in IndexedDB (never leaves the browser)
      const storage = new IndexedDBBackend(`tacit-${user.id}`);
      await storage.set('identity', serializeIdentity(newIdentity));
      await storage.close();

      // Calculate trust score
      const platformScore = connectedProviders.length * 15;
      const emailScore = user.email ? 10 : 0;
      const finalScore = Math.min(10 + platformScore + emailScore, 100);
      setTrustScore(finalScore);

      // Determine trust level
      let trustLevel = 'new';
      if (finalScore >= 80) trustLevel = 'exemplary';
      else if (finalScore >= 60) trustLevel = 'trusted';
      else if (finalScore >= 40) trustLevel = 'established';
      else if (finalScore >= 20) trustLevel = 'emerging';

      // Save profile to Supabase
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        did: newIdentity.did,
        public_key_hex: newIdentity.publicKeyHex,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        domain: 'professional',
        seeking: seeking.trim() || null,
        offering: offering.trim() || null,
        trust_score: finalScore,
        trust_level: trustLevel,
        onboarding_complete: true,
      });

      if (profileError) {
        console.error('Profile save error:', profileError);
        setError('Failed to save profile. Please try again.');
        setStep('profile');
        return;
      }

      // Save credential records for connected providers
      for (const provider of connectedProviders) {
        const { error: credError } = await supabase.from('credentials').upsert({
          user_id: user.id,
          provider,
          provider_user_id: (user.user_metadata?.sub as string) || user.id,
          provider_email: user.email || null,
          provider_name: displayName,
          account_created_at: (user.user_metadata?.created_at as string) || null,
          credential_type: 'PlatformVerification',
          credential_json: {
            type: 'PlatformVerification',
            issuer: 'did:tacit:service',
            claim: `Verified ${provider} account`,
            issued: new Date().toISOString(),
          },
          verified_at: new Date().toISOString(),
        }, { onConflict: 'user_id, provider' });
        if (credError) {
          console.error(`Failed to save ${provider} credential:`, credError.message);
        }
      }

      // Also save email as a credential if signed up with email
      if (user.email && !connectedProviders.includes('email')) {
        const { error: emailCredError } = await supabase.from('credentials').upsert({
          user_id: user.id,
          provider: 'email',
          provider_user_id: user.id,
          provider_email: user.email,
          provider_name: displayName,
          credential_type: 'EmailVerification',
          credential_json: {
            type: 'EmailVerification',
            issuer: 'did:tacit:service',
            claim: `Verified email: ${user.email}`,
            issued: new Date().toISOString(),
          },
          verified_at: new Date().toISOString(),
        }, { onConflict: 'user_id, provider' });
        if (emailCredError) {
          console.error('Failed to save email credential:', emailCredError.message);
        }
      }

      // Brief animation delay
      await new Promise((r) => setTimeout(r, 2000));
      setStep('complete');
    } catch (err) {
      console.error('Minting error:', err);
      setError('Something went wrong during identity minting. Please try again.');
      setStep('profile');
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(['profile', 'minting', 'complete'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-accent text-white'
                    : ['profile', 'minting', 'complete'].indexOf(step) > i
                    ? 'bg-success text-white'
                    : 'bg-bg-card text-text-muted border border-border'
                }`}
              >
                {['profile', 'minting', 'complete'].indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Profile Setup */}
        {step === 'profile' && (
          <div>
            <div className="text-center mb-8">
              <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Set up your identity</h1>
              <p className="text-text-muted">
                Tell the network who you are. This will be visible to other verified members.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Trust Score Preview */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Starting Trust Score</span>
                <span className="text-xl font-bold text-accent">{trustScore}</span>
              </div>
              <div className="h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${trustScore}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                {connectedProviders.length > 0
                  ? `Signed in via ${connectedProviders[0]} (+15 points). Connect more accounts later to boost your score.`
                  : 'Signed in via email (+10 points). Connect Google or GitHub in settings to boost your score.'}
              </p>
            </div>

            {/* Connected Account Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {user.email}
              </span>
              {connectedProviders.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {p}
                </span>
              ))}
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Display Name *</label>
                <span className={`text-[10px] ${displayName.length > 50 ? 'text-danger' : 'text-text-muted'}`}>{displayName.length}/50</span>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                maxLength={50}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                placeholder="How others will see you"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Bio</label>
                <span className={`text-[10px] ${bio.length > 500 ? 'text-danger' : 'text-text-muted'}`}>{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                maxLength={500}
                rows={2}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent resize-none"
                placeholder="What are you working on?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Seeking</label>
                  <span className={`text-[10px] ${seeking.length > 200 ? 'text-danger' : 'text-text-muted'}`}>{seeking.length}/200</span>
                </div>
                <input
                  type="text"
                  value={seeking}
                  onChange={(e) => setSeeking(e.target.value.slice(0, 200))}
                  maxLength={200}
                  className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                  placeholder="Co-founder, funding..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Offering</label>
                  <span className={`text-[10px] ${offering.length > 200 ? 'text-danger' : 'text-text-muted'}`}>{offering.length}/200</span>
                </div>
                <input
                  type="text"
                  value={offering}
                  onChange={(e) => setOffering(e.target.value.slice(0, 200))}
                  maxLength={200}
                  className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
                  placeholder="Engineering, design..."
                />
              </div>
            </div>

            <button
              onClick={mintIdentity}
              disabled={!displayName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              Mint My Identity
              <Fingerprint className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Minting */}
        {step === 'minting' && (
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Fingerprint className="w-24 h-24 text-accent animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Minting your identity...</h1>
            <p className="text-text-muted mb-4">
              Generating Ed25519 key pair on your device.
              <br />
              Your private key never leaves this browser.
            </p>
            <div className="space-y-2 text-sm text-text-muted">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Key pair generated
              </p>
              <p className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating W3C DID...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && identity && (
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Identity minted!</h1>
            <p className="text-text-muted mb-8">
              Welcome to the TACIT network. Your cryptographic identity is ready.
            </p>

            {/* Identity Card Preview */}
            <div className="bg-bg-card border border-accent/30 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-accent">TACIT Identity</span>
                </div>
                <span className="text-2xl font-bold">{trustScore}</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">{displayName}</h3>
              {bio && <p className="text-text-muted text-sm mb-3">{bio}</p>}
              <div className="bg-bg rounded-lg p-3 mb-3">
                <p className="text-xs text-text-muted mb-1">DID</p>
                <p className="text-xs font-mono break-all">{identity.did}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  email
                </span>
                {connectedProviders.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright text-white px-5 py-3.5 rounded-xl font-medium transition-colors"
            >
              Enter the Network
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
