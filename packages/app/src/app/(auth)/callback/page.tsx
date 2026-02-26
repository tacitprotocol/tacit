'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2 } from 'lucide-react';

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function handleCallback() {
      // Handle OAuth hash fragment (Supabase returns tokens in the URL hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace('/login');
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
    }

    handleCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
        <Loader2 className="w-6 h-6 text-text-muted animate-spin mx-auto mb-3" />
        <p className="text-text-muted">Verifying your identity...</p>
      </div>
    </div>
  );
}
