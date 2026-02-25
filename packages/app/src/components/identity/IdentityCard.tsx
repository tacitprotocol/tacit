'use client';

import { Shield, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface IdentityCardProps {
  did: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  trustScore: number;
  trustLevel: string;
  credentials: { provider: string; verified_at: string }[];
}

export function IdentityCard({
  did,
  displayName,
  bio,
  avatarUrl,
  trustScore,
  trustLevel,
  credentials,
}: IdentityCardProps) {
  const [copied, setCopied] = useState(false);

  function copyDid() {
    navigator.clipboard.writeText(did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shortDid = did.length > 30 ? `${did.slice(0, 20)}...${did.slice(-8)}` : did;

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header gradient */}
      <div className="h-20 bg-gradient-to-r from-accent/20 via-accent-bright/10 to-accent-dim/20" />

      <div className="px-6 pb-6 -mt-10">
        {/* Avatar */}
        <div className="flex items-end justify-between mb-4">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated border-4 border-bg-card flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-text-muted">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-semibold">
            <Shield className="w-4 h-4" />
            {trustScore}
          </div>
        </div>

        {/* Name + Bio */}
        <h2 className="text-xl font-bold mb-1">{displayName}</h2>
        {bio && <p className="text-text-muted text-sm mb-3">{bio}</p>}

        {/* DID */}
        <button
          onClick={copyDid}
          className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 w-full text-left hover:bg-bg-elevated transition-colors group mb-4"
        >
          <code className="text-xs text-text-muted flex-1 truncate">{shortDid}</code>
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-text-muted group-hover:text-text shrink-0" />
          )}
        </button>

        {/* Verified credentials */}
        <div className="flex flex-wrap gap-2 mb-4">
          {credentials.map((c) => (
            <span
              key={c.provider}
              className="inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full"
            >
              <CheckCircle2 className="w-3 h-3" />
              {c.provider}
            </span>
          ))}
        </div>

        {/* QR Code */}
        <details className="group">
          <summary className="text-sm text-text-muted cursor-pointer hover:text-text transition-colors flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            Share Identity (QR)
          </summary>
          <div className="mt-3 flex justify-center p-4 bg-white rounded-xl">
            <QRCodeSVG value={did} size={160} level="M" />
          </div>
        </details>
      </div>
    </div>
  );
}
