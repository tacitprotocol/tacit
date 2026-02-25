'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Shield, Key, Trash2, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [did, setDid] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
      }
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('did')
          .eq('id', user.id)
          .single();
        if (data) setDid(data.did);
      }
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-text-muted mb-8">Manage your account and security preferences</p>

      <div className="max-w-2xl space-y-6">
        {/* Account */}
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Account</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-muted">Email</label>
              <p className="text-sm font-medium">{email}</p>
            </div>
            <div>
              <label className="text-sm text-text-muted">DID</label>
              <p className="text-xs font-mono break-all">{did}</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <p className="text-sm text-text-muted mb-3">
            Your private key is stored in this browser&apos;s IndexedDB. It never leaves your device.
            If you clear browser data, you will need to re-mint your identity.
          </p>
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl">
            <p className="text-xs text-warning">
              Key backup and recovery is coming in a future update. For now, your identity
              is tied to this browser. Do not clear site data.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">TACIT Protocol</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Protocol Website', href: 'https://tacitprotocol.com' },
              { label: 'GitHub', href: 'https://github.com/tacitprotocol' },
              { label: 'Documentation', href: 'https://github.com/tacitprotocol/tacit' },
              { label: 'X / Twitter', href: 'https://x.com/tacitprotocol' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-elevated transition-colors text-sm"
              >
                {label}
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </a>
            ))}
          </div>
        </div>

        {/* Danger */}
        <div className="bg-bg-card border border-danger/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-danger" />
            <h3 className="font-semibold text-danger">Danger Zone</h3>
          </div>
          <p className="text-sm text-text-muted mb-4">
            Deleting your account will permanently remove your profile, credentials,
            and all associated data. Your DID will be revoked.
          </p>
          <button className="text-sm text-danger border border-danger/30 hover:bg-danger/10 px-4 py-2 rounded-xl transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
