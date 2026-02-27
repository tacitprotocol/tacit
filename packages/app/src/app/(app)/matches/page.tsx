'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface MatchRequest {
  id: string;
  user_id: string;
  target_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profiles?: {
    display_name: string;
    trust_score: number;
    trust_level: string;
    bio: string | null;
    seeking: string | null;
    offering: string | null;
    avatar_url: string | null;
  };
}

type Tab = 'incoming' | 'outgoing';

export default function MatchesPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('incoming');
  const [incoming, setIncoming] = useState<MatchRequest[]>([]);
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [inRes, outRes] = await Promise.all([
      supabase
        .from('engagement_requests')
        .select('*, profiles!engagement_requests_user_id_fkey(display_name, trust_score, trust_level, bio, seeking, offering, avatar_url)')
        .eq('target_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('engagement_requests')
        .select('*, profiles!engagement_requests_target_id_fkey(display_name, trust_score, trust_level, bio, seeking, offering, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (inRes.error) {
      console.error('Failed to load incoming:', inRes.error.message);
      // Table may not exist yet — show empty state
    }
    if (outRes.error) {
      console.error('Failed to load outgoing:', outRes.error.message);
    }

    setIncoming((inRes.data as MatchRequest[]) || []);
    setOutgoing((outRes.data as MatchRequest[]) || []);
    setLoading(false);
  }

  async function handleAction(requestId: string, status: 'accepted' | 'declined') {
    setActionLoading(requestId);
    setError(null);

    const { error: updateError } = await supabase
      .from('engagement_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) {
      setError(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} request.`);
    } else {
      setIncoming((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
    }
    setActionLoading(null);
  }

  const current = tab === 'incoming' ? incoming : outgoing;
  const pending = incoming.filter((r) => r.status === 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Matches</h1>
      <p className="text-text-muted mb-8">
        Introduction proposals from the TACIT matching engine. Double opt-in at every stage.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg-card border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'incoming' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Incoming
          {pending.length > 0 && (
            <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'outgoing' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Outgoing
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : current.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <Inbox className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {tab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
          </h3>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            {tab === 'incoming'
              ? 'When someone wants to connect with you, their request will appear here. Both parties must accept before any identity is revealed.'
              : 'Requests you send to other members will appear here.'}
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Browse Network
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((r) => {
            const profile = r.profiles;
            return (
              <div
                key={r.id}
                className="bg-bg-card border border-border rounded-2xl p-5 hover:border-border-bright transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-text-muted">
                          {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{profile?.display_name || 'Unknown User'}</h3>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Shield className="w-3 h-3" />
                        Trust: {profile?.trust_score || 0}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          profile?.trust_level === 'trusted' || profile?.trust_level === 'exemplary'
                            ? 'bg-success/10 text-success'
                            : 'bg-bg-elevated text-text-muted'
                        }`}>
                          {profile?.trust_level || 'new'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.status === 'pending' ? 'bg-warning/10 text-warning' :
                      r.status === 'accepted' ? 'bg-success/10 text-success' :
                      r.status === 'declined' ? 'bg-danger/10 text-danger' :
                      'bg-bg-elevated text-text-muted'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Bio & Intent */}
                {profile?.bio && (
                  <p className="text-sm text-text-muted mt-3 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-text-muted">
                  {profile?.seeking && <span><span className="text-text font-medium">Seeking:</span> {profile.seeking}</span>}
                  {profile?.offering && <span><span className="text-text font-medium">Offering:</span> {profile.offering}</span>}
                </div>

                {r.message && (
                  <p className="text-sm text-text-muted mt-2 italic">&ldquo;{r.message}&rdquo;</p>
                )}

                <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
                  <Clock className="w-3 h-3" />
                  {new Date(r.created_at).toLocaleDateString()}
                </div>

                {/* Actions for incoming pending requests */}
                {tab === 'incoming' && r.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAction(r.id, 'accepted')}
                      disabled={actionLoading === r.id}
                      className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'declined')}
                      disabled={actionLoading === r.id}
                      className="flex items-center gap-1.5 bg-bg-elevated hover:bg-danger/10 text-text-muted hover:text-danger px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* How matching works */}
      <div className="mt-8 bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">How TACIT Matching Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center text-sm font-bold mb-2">
              1
            </div>
            <h4 className="text-sm font-medium mb-1">Publish Intent</h4>
            <p className="text-xs text-text-muted">
              Describe what you&apos;re seeking and offering. The engine scores compatibility across 5 dimensions.
            </p>
          </div>
          <div>
            <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center text-sm font-bold mb-2">
              2
            </div>
            <h4 className="text-sm font-medium mb-1">Double Opt-In</h4>
            <p className="text-xs text-text-muted">
              Both parties review the match score and rationale. No contact happens until both accept.
            </p>
          </div>
          <div>
            <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center text-sm font-bold mb-2">
              3
            </div>
            <h4 className="text-sm font-medium mb-1">Progressive Reveal</h4>
            <p className="text-xs text-text-muted">
              Start with context only. Reveal your identity in stages, always with mutual consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
