'use client';

import { Shield } from 'lucide-react';

interface TrustScoreCardProps {
  score: number;
  level: string;
  dimensions?: {
    tenure: number;
    consistency: number;
    attestations: number;
    networkTrust: number;
  };
}

const levelColors: Record<string, string> = {
  new: 'text-trust-new',
  emerging: 'text-trust-emerging',
  established: 'text-trust-established',
  trusted: 'text-trust-trusted',
  exemplary: 'text-trust-exemplary',
};

const levelBgColors: Record<string, string> = {
  new: 'bg-trust-new/10',
  emerging: 'bg-trust-emerging/10',
  established: 'bg-trust-established/10',
  trusted: 'bg-trust-trusted/10',
  exemplary: 'bg-trust-exemplary/10',
};

export function TrustScoreCard({ score, level, dimensions }: TrustScoreCardProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-accent" />
        <h3 className="font-semibold">Trust Score</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${levelColors[level] || 'text-accent'} score-gauge`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-xs text-text-muted capitalize">{level}</span>
          </div>
        </div>

        {/* Dimensions */}
        {dimensions && (
          <div className="flex-1 space-y-2.5">
            {Object.entries(dimensions).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-muted capitalize">
                    {key === 'networkTrust' ? 'Network' : key}
                  </span>
                  <span>{Math.round(value * 100)}%</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`mt-4 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${levelBgColors[level] || 'bg-accent/10'} ${levelColors[level] || 'text-accent'}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {level.charAt(0).toUpperCase() + level.slice(1)} Trust Level
      </div>
    </div>
  );
}
