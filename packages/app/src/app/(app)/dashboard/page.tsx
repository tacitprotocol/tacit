'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrustScoreCard } from '@/components/identity/TrustScoreCard';
import { IdentityCard } from '@/components/identity/IdentityCard';
import {
  Users,
  Compass,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { UserProfile, Credential } from '@/lib/tacit/store';

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState({ members: 0, matches: 0, intents: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, credsRes, membersRes, intentsRes, matchesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('credentials').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('engagement_requests').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('engagement_requests').select('id', { count: 'exact', head: true }).eq('target_id', user.id).eq('status', 'pending'),
      ]);

      if (profileRes.error) {
        console.error('Failed to load profile:', profileRes.error.message);
        setLoadError('Failed to load your profile. Please refresh the page.');
      }
      if (credsRes.error) {
        console.error('Failed to load credentials:', credsRes.error.message);
      }

      if (profileRes.data) setProfile(profileRes.data);
      if (credsRes.data) setCredentials(credsRes.data);
      setStats({
        members: membersRes.count || 0,
        matches: matchesRes.count || 0,
        intents: intentsRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Profile not found. Complete onboarding first.</p>
        <Link href="/onboarding" className="text-accent hover:underline">
          Go to onboarding
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-text-muted mb-8">Welcome back, {profile.display_name}</p>

      {loadError && (
        <div className="mb-6 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {loadError}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Network Members', value: stats.members, color: 'text-accent' },
          { icon: TrendingUp, label: 'Trust Score', value: profile.trust_score, color: 'text-success' },
          { icon: Compass, label: 'Active Intents', value: stats.intents, color: 'text-warning' },
          { icon: Clock, label: 'Pending Matches', value: stats.matches, color: 'text-trust-emerging' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm text-text-muted">{label}</span>
            </div>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity Card */}
        <IdentityCard
          did={profile.did}
          displayName={profile.display_name}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          trustScore={profile.trust_score}
          trustLevel={profile.trust_level}
          credentials={credentials}
        />

        {/* Trust Score + Actions */}
        <div className="space-y-6">
          <TrustScoreCard
            score={profile.trust_score}
            level={profile.trust_level}
            dimensions={{
              tenure: Math.min(profile.trust_score / 100, 1),
              consistency: 0.8,
              attestations: credentials.length * 0.25,
              networkTrust: 0.1,
            }}
          />

          {/* Quick Actions */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Get Started</h3>
            <div className="space-y-3">
              <Link
                href="/discover"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-sm font-medium">Publish an Intent</div>
                    <div className="text-xs text-text-muted">Tell the network what you&apos;re looking for</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <div>
                    <div className="text-sm font-medium">Boost Trust Score</div>
                    <div className="text-xs text-text-muted">Connect more accounts to increase verification</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
