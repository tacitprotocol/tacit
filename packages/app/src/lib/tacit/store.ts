/**
 * Zustand store for TACIT app state.
 * Manages identity, profile, and UI state on the client side.
 */

import { create } from 'zustand';
import type { TacitIdentity } from './identity';

export interface UserProfile {
  id: string;
  did: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  domain: string;
  seeking: string | null;
  offering: string | null;
  trust_score: number;
  trust_level: string;
  onboarding_complete: boolean;
  created_at: string;
}

export interface Credential {
  id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  provider_name: string | null;
  account_created_at: string | null;
  verified_at: string;
}

interface TacitStore {
  // Identity (client-side only)
  identity: TacitIdentity | null;
  setIdentity: (identity: TacitIdentity) => void;

  // Profile (from Supabase)
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;

  // Credentials
  credentials: Credential[];
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Credential) => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useTacitStore = create<TacitStore>((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),

  profile: null,
  setProfile: (profile) => set({ profile }),

  credentials: [],
  setCredentials: (credentials) => set({ credentials }),
  addCredential: (credential) =>
    set((state) => ({ credentials: [...state.credentials, credential] })),

  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
}));
