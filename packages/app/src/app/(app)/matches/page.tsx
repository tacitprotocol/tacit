'use client';

import { Users, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function MatchesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Matches</h1>
      <p className="text-text-muted mb-8">
        Introduction proposals from the TACIT matching engine. Double opt-in at every stage.
      </p>

      {/* Empty state */}
      <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
        <Inbox className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
        <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
          When the matching engine finds compatible verified users based on your
          intents, introduction proposals will appear here. Both parties must
          accept before any identity is revealed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/discover"
            className="flex items-center gap-2 bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Browse Network
          </Link>
        </div>
      </div>

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
