'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IdentityCard } from '@/components/identity/IdentityCard';
import { TrustScoreCard } from '@/components/identity/TrustScoreCard';
import {
  Loader2,
  Save,
  CheckCircle2,
  Github,
  Mail,
} from 'lucide-react';
import type { UserProfile, Credential } from '@/lib/tacit/store';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seeking, setSeeking] = useState('');
  const [offering, setOffering] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, credsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('credentials').select('*').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setDisplayName(profileRes.data.display_name);
        setBio(profileRes.data.bio || '');
        setSeeking(profileRes.data.seeking || '');
        setOffering(profileRes.data.offering || '');
      }
      if (credsRes.data) setCredentials(credsRes.data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: bio || null,
        seeking: seeking || null,
        offering: offering || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setProfile({ ...profile, display_name: displayName, bio, seeking, offering });
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function connectProvider(provider: 'google' | 'github') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const connectedProviders = credentials.map((c) => c.provider);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Identity</h1>
      <p className="text-text-muted mb-8">Manage your cryptographic identity and verified accounts</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Identity Card + Trust Score */}
        <div className="space-y-6">
          <IdentityCard
            did={profile.did}
            displayName={profile.display_name}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            trustScore={profile.trust_score}
            trustLevel={profile.trust_level}
            credentials={credentials}
          />
          <TrustScoreCard
            score={profile.trust_score}
            level={profile.trust_level}
          />
        </div>

        {/* Right: Edit Profile + Connected Accounts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent resize-none"
                  placeholder="What are you working on?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Seeking</label>
                  <input
                    type="text"
                    value={seeking}
                    onChange={(e) => setSeeking(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                    placeholder="Co-founder, engineer..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Offering</label>
                  <input
                    type="text"
                    value={offering}
                    onChange={(e) => setOffering(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                    placeholder="Technical expertise..."
                  />
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Verified Accounts</h3>
            <p className="text-sm text-text-muted mb-4">
              Each connected account adds to your trust score. More connections = higher verification.
            </p>
            <div className="space-y-3">
              {[
                { provider: 'google', icon: Mail, label: 'Google', color: 'text-red-400' },
                { provider: 'github', icon: Github, label: 'GitHub', color: 'text-white' },
              ].map(({ provider, icon: Icon, label, color }) => {
                const isConnected = connectedProviders.includes(provider);
                const cred = credentials.find((c) => c.provider === provider);
                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        {cred && (
                          <div className="text-xs text-text-muted">
                            {cred.provider_email || cred.provider_name || 'Connected'}
                          </div>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => connectProvider(provider as 'google' | 'github')}
                        className="text-xs text-accent hover:text-accent-bright transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
