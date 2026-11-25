'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppUser } from '@/types/mcq';

const DEFAULT_GUEST_USER: AppUser = {
  id: 'guest',
  name: 'Guest Learner',
  provider: 'local',
};

const LOCAL_PROFILES_KEY = 'nec_local_profiles_v1';
const ACTIVE_LOCAL_ID_KEY = 'nec_active_local_profile_v1';

interface AuthContextValue {
  user: AppUser;
  googleUser: AppUser | null;
  googleConfigured: boolean;
  loading: boolean;
  localProfiles: AppUser[];
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  switchLocalProfile: (profileId: string) => void;
  createLocalProfile: (name: string) => AppUser;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredLocalProfiles(): AppUser[] {
  if (typeof window === 'undefined') return [DEFAULT_GUEST_USER];
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) return [DEFAULT_GUEST_USER];
    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_GUEST_USER];
    const hasGuest = parsed.some((p) => p.id === 'guest');
    return hasGuest ? parsed : [DEFAULT_GUEST_USER, ...parsed];
  } catch {
    return [DEFAULT_GUEST_USER];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [googleUser, setGoogleUser] = useState<AppUser | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localProfiles, setLocalProfiles] = useState<AppUser[]>([DEFAULT_GUEST_USER]);
  const [activeLocalId, setActiveLocalId] = useState<string>('guest');

  useEffect(() => {
    const storedProfiles = loadStoredLocalProfiles();
    setLocalProfiles(storedProfiles);
    const savedId = window.localStorage.getItem(ACTIVE_LOCAL_ID_KEY);
    if (savedId && storedProfiles.some((p) => p.id === savedId)) {
      setActiveLocalId(savedId);
    }

    let mounted = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { googleConfigured?: boolean; user?: AppUser | null } | null) => {
        if (!mounted || !data) return;
        setGoogleConfigured(Boolean(data.googleConfigured));
        setGoogleUser(data.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeLocalProfile = useMemo(
    () => localProfiles.find((p) => p.id === activeLocalId) ?? DEFAULT_GUEST_USER,
    [localProfiles, activeLocalId]
  );

  const user = googleUser ?? activeLocalProfile;

  const signInWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on sign out
    }
    setGoogleUser(null);
  }, []);

  const switchLocalProfile = useCallback((profileId: string) => {
    setActiveLocalId(profileId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_LOCAL_ID_KEY, profileId);
    }
  }, []);

  const createLocalProfile = useCallback(
    (name: string): AppUser => {
      const cleaned = name.trim().slice(0, 32) || 'Learner';
      const slug =
        cleaned
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'user';
      const newProfile: AppUser = {
        id: `local:${slug}-${Date.now().toString(36)}`,
        name: cleaned,
        provider: 'local',
      };
      const updated = [...localProfiles, newProfile];
      setLocalProfiles(updated);
      setActiveLocalId(newProfile.id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
        window.localStorage.setItem(ACTIVE_LOCAL_ID_KEY, newProfile.id);
      }
      return newProfile;
    },
    [localProfiles]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      googleUser,
      googleConfigured,
      loading,
      localProfiles,
      signInWithGoogle,
      signOut,
      switchLocalProfile,
      createLocalProfile,
    }),
    [
      user,
      googleUser,
      googleConfigured,
      loading,
      localProfiles,
      signInWithGoogle,
      signOut,
      switchLocalProfile,
      createLocalProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
