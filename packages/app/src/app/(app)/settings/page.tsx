'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Shield, Key, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { IndexedDBBackend } from '@/lib/tacit/indexed-db-backend';

export default function SettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [did, setDid] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user data from DB tables
      await Promise.all([
        supabase.from('credentials').delete().eq('user_id', user.id),
        supabase.from('engagement_requests').delete().eq('user_id', user.id),
        supabase.from('engagement_requests').delete().eq('target_id', user.id),
        supabase.from('agent_profiles').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('id', user.id),
      ]);

      // Clean up IndexedDB private keys
      const dbNames = ['tacit-identity', 'tacit-keys'];
      for (const dbName of dbNames) {
        try {
          const backend = new IndexedDBBackend(dbName);
          await backend.close();
          indexedDB.deleteDatabase(dbName);
        } catch (e) {
          console.warn(`Failed to delete IndexedDB "${dbName}":`, e);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error('Failed to delete account:', e);
      setDeleteError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

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
                rel="noopener noreferrer"
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
          {deleteError && (
            <div className="mb-3 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
              {deleteError}
            </div>
          )}
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-danger font-medium">
                Type DELETE to confirm account deletion:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-bg border border-danger/30 rounded-xl px-4 py-2.5 text-text text-sm focus:outline-none focus:border-danger"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'DELETE' || deleting}
                  className="flex items-center gap-2 text-sm bg-danger hover:bg-danger/90 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="text-sm text-text-muted hover:text-text px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-danger border border-danger/30 hover:bg-danger/10 px-4 py-2 rounded-xl transition-colors"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
