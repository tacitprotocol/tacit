'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Compass,
  Search,
  Shield,
  CheckCircle2,
  Users,
  Loader2,
  Send,
} from 'lucide-react';

interface PublicProfile {
  id: string;
  did: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  trust_score: number;
  trust_level: string;
  seeking: string | null;
  offering: string | null;
  domain: string;
}

export default function DiscoverPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_complete', true)
        .order('trust_score', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to load profiles:', error.message);
        setLoadError('Failed to load network members. Please refresh the page.');
      }
      if (data) setProfiles(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = profiles.filter((p) => {
    if (p.id === currentUserId) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.display_name.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q) ||
      p.seeking?.toLowerCase().includes(q) ||
      p.offering?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Discover</h1>
      <p className="text-text-muted mb-8">
        Browse verified members of the TACIT network. Everyone here has a cryptographic identity.
      </p>

      {loadError && (
        <div className="mb-6 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
          {loadError}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, skills, or what people are seeking..."
          className="w-full bg-bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-text focus:outline-none focus:border-accent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'No matches found' : 'No members yet'}
          </h3>
          <p className="text-text-muted text-sm">
            {search
              ? 'Try a different search term'
              : 'Be one of the first to join the verified network!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              className={`bg-bg-card border rounded-2xl p-5 transition-colors cursor-pointer ${
                expandedId === p.id ? 'border-accent/40' : 'border-border hover:border-border-bright'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-text-muted">
                        {p.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{p.display_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Shield className="w-3 h-3" />
                      Score: {p.trust_score}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.trust_level === 'trusted' || p.trust_level === 'exemplary'
                      ? 'bg-success/10 text-success'
                      : p.trust_level === 'established'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-bg-elevated text-text-muted'
                  }`}
                >
                  {p.trust_level}
                </span>
              </div>

              {/* Bio — show truncated or full */}
              {p.bio && (
                <p className={`text-sm text-text-muted mb-3 ${expandedId === p.id ? '' : 'line-clamp-2'}`}>{p.bio}</p>
              )}

              {/* Seeking / Offering */}
              <div className="space-y-1.5 mb-4">
                {p.seeking && (
                  <div className="flex items-start gap-2 text-xs">
                    <Compass className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                    <span className="text-text-muted">
                      <span className="text-text font-medium">Seeking:</span> {p.seeking}
                    </span>
                  </div>
                )}
                {p.offering && (
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                    <span className="text-text-muted">
                      <span className="text-text font-medium">Offering:</span> {p.offering}
                    </span>
                  </div>
                )}
              </div>

              {/* DID — full when expanded */}
              <div className="bg-bg rounded-lg px-3 py-1.5 mb-3">
                <code className={`text-[10px] text-text-muted block ${expandedId === p.id ? 'break-all' : 'truncate'}`}>
                  {expandedId === p.id ? p.did : `${p.did.slice(0, 24)}...`}
                </code>
              </div>

              {/* Domain badge when expanded */}
              {expandedId === p.id && (
                <div className="mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted">
                    {p.domain}
                  </span>
                </div>
              )}

              {/* Action */}
              <button
                disabled
                title="Coming soon"
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 bg-bg-elevated text-text-muted text-sm font-medium py-2 rounded-xl cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Request Introduction (Coming Soon)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
