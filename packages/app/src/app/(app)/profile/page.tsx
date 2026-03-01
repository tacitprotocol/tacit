'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IdentityCard } from '@/components/identity/IdentityCard';
import { TrustScoreCard } from '@/components/identity/TrustScoreCard';
import { useToast } from '@/components/ui/Toast';
import {
  Loader2,
  Save,
  CheckCircle2,
  Github,
  Mail,
  Camera,
} from 'lucide-react';
import type { UserProfile, Credential } from '@/lib/tacit/store';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      // Resize to max 512x512 while maintaining aspect ratio
      const maxSize = 512;
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h / w) * maxSize);
          w = maxSize;
        } else {
          w = Math.round((w / h) * maxSize);
          h = maxSize;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export default function ProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [seeking, setSeeking] = useState('');
  const [offering, setOffering] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, credsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('credentials').select('*').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setDisplayName(profileRes.data.display_name);
        setBio(profileRes.data.bio || '');
        setSeeking(profileRes.data.seeking || '');
        setOffering(profileRes.data.offering || '');
      }
      if (credsRes.data) setCredentials(credsRes.data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: bio || null,
        seeking: seeking || null,
        offering: offering || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      console.error('Failed to save profile:', error.message);
      setSaveError('Failed to save changes. Please try again.');
      toast('Failed to save changes', 'error');
    } else {
      setSaved(true);
      setProfile({ ...profile, display_name: displayName, bio, seeking, offering });
      toast('Profile saved successfully', 'success');
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE * 2) {
      // Allow up to 4MB raw, we compress it down
      toast('Image is too large. Maximum size is 4MB.', 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Compress/resize image
      const compressed = await compressImage(file);

      // Upload to Supabase Storage
      const filePath = `${profile.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Avatar upload failed:', uploadError.message);
        toast('Failed to upload avatar. Please try again.', 'error');
        setUploadingAvatar(false);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-bust to force refresh
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update the profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Failed to update avatar URL:', updateError.message);
        toast('Avatar uploaded but failed to update profile.', 'error');
      } else {
        setProfile({ ...profile, avatar_url: avatarUrl });
        toast('Avatar updated successfully', 'success');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast('Failed to process image. Please try a different file.', 'error');
    }

    setUploadingAvatar(false);
  }

  async function connectProvider(provider: 'google' | 'github') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const connectedProviders = credentials.map((c) => c.provider);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Identity</h1>
      <p className="text-text-muted mb-8">Manage your cryptographic identity and verified accounts</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Identity Card + Trust Score */}
        <div className="space-y-6">
          <IdentityCard
            did={profile.did}
            displayName={profile.display_name}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            trustScore={profile.trust_score}
            trustLevel={profile.trust_level}
            credentials={credentials}
          />
          <TrustScoreCard
            score={profile.trust_score}
            level={profile.trust_level}
          />
        </div>

        {/* Right: Edit Profile + Connected Accounts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative w-16 h-16 rounded-2xl bg-bg-elevated border-2 border-border hover:border-accent/50 transition-colors overflow-hidden group shrink-0"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-xl font-bold text-text-muted">
                      {displayName.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-text-muted">
                    Click to upload. JPG, PNG, or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Display Name</label>
                  <span className={`text-[10px] ${displayName.length > 50 ? 'text-danger' : 'text-text-muted'}`}>{displayName.length}/50</span>
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                  maxLength={50}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Bio</label>
                  <span className={`text-[10px] ${bio.length > 500 ? 'text-danger' : 'text-text-muted'}`}>{bio.length}/500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={3}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent resize-none"
                  placeholder="What are you working on?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">Seeking</label>
                    <span className={`text-[10px] ${seeking.length > 200 ? 'text-danger' : 'text-text-muted'}`}>{seeking.length}/200</span>
                  </div>
                  <input
                    type="text"
                    value={seeking}
                    onChange={(e) => setSeeking(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                    placeholder="Co-founder, engineer..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">Offering</label>
                    <span className={`text-[10px] ${offering.length > 200 ? 'text-danger' : 'text-text-muted'}`}>{offering.length}/200</span>
                  </div>
                  <input
                    type="text"
                    value={offering}
                    onChange={(e) => setOffering(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-accent"
                    placeholder="Technical expertise..."
                  />
                </div>
              </div>
              {saveError && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
                  {saveError}
                </div>
              )}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-accent hover:bg-accent-bright disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Verified Accounts</h3>
            <p className="text-sm text-text-muted mb-4">
              Each connected account adds to your trust score. More connections = higher verification.
            </p>
            <div className="space-y-3">
              {[
                { provider: 'google', icon: Mail, label: 'Google', color: 'text-red-400' },
                { provider: 'github', icon: Github, label: 'GitHub', color: 'text-white' },
              ].map(({ provider, icon: Icon, label, color }) => {
                const isConnected = connectedProviders.includes(provider);
                const cred = credentials.find((c) => c.provider === provider);
                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        {cred && (
                          <div className="text-xs text-text-muted">
                            {cred.provider_email || cred.provider_name || 'Connected'}
                          </div>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => connectProvider(provider as 'google' | 'github')}
                        className="text-xs text-accent hover:text-accent-bright transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
