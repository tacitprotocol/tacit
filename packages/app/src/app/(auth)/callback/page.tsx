'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    // Show timeout feedback if verification takes too long
    const slowTimer = setTimeout(() => setSlow(true), 8000);
    const failTimer = setTimeout(() => {
      setError('Verification is taking too long. Please try logging in again.');
    }, 20000);

    async function handleCallback() {
      try {
        // Handle OAuth hash fragment (Supabase returns tokens in the URL hash)
        const hash = window.location.hash.substring(1);

        // Validate that hash contains expected auth params
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          // Check for error in hash (Supabase may return error fragments)
          const hashError = hashParams.get('error');
          const hashErrorDescription = hashParams.get('error_description');
          if (hashError) {
            setError(hashErrorDescription || `Authentication error: ${hashError}`);
            return;
          }

          if (accessToken && refreshToken) {
            // Validate token format (JWTs have 3 dot-separated parts)
            const parts = accessToken.split('.');
            if (parts.length !== 3) {
              setError('Invalid authentication token received. Please try again.');
              return;
            }

            // Check token expiration before calling setSession
            try {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                setError('Your login link has expired. Please request a new one.');
                return;
              }
            } catch {
              // If we can't decode the payload, let Supabase SDK handle validation
            }

            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setError(`Session error: ${sessionError.message}. Please try logging in again.`);
              return;
            }
          }
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('Could not verify your identity. Please try logging in again.');
          return;
        }

        // Check if user has a profile already — use maybeSingle to handle no-row case
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.onboarding_complete) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred. Please try logging in again.');
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(failTimer);
      }
    }

    handleCallback();

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(failTimer);
    };
  }, [router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Verification Failed</h2>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
        <Loader2 className="w-6 h-6 text-text-muted animate-spin mx-auto mb-3" />
        <p className="text-text-muted">Verifying your identity...</p>
        {slow && (
          <p className="text-text-muted text-xs mt-3">
            Still working... this is taking longer than usual.
          </p>
        )}
      </div>
    </div>
  );
}
