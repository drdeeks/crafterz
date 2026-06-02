import { useState, useEffect, useCallback } from 'react';

const PROFILE_KEY = 'crafterz:profile:v1';

interface StoredProfile {
  username?: string;
  pfpDataUrl?: string | null;
}

export interface UserProfile {
  fid: number | null;
  username: string;
  displayName: string;
  pfpUrl: string | null;
  pfpDataUrl: string | null;
  bio: string | null;
  followerCount: number | null;
  followingCount: number | null;
  walletAddress: string | null;
  verifications: string[];
  isOnFarcaster: boolean;
  isLoading: boolean;
}

function loadStored(): StoredProfile {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') as StoredProfile;
  } catch {
    return {};
  }
}

function saveStored(updates: Partial<StoredProfile>) {
  try {
    const existing = loadStored();
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, ...updates }));
  } catch { /* ignore */ }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = loadStored();
    return {
      fid: null,
      username: stored.username ?? 'you',
      displayName: 'CrafterZ Player',
      pfpUrl: null,
      pfpDataUrl: stored.pfpDataUrl ?? null,
      bio: null,
      followerCount: null,
      followingCount: null,
      walletAddress: null,
      verifications: [],
      isOnFarcaster: false,
      isLoading: true,
    };
  });

  useEffect(() => {
    const init = async () => {
      const stored = loadStored();
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ctx = sdk.context;

        if (ctx?.user?.fid) {
          const fid = ctx.user.fid;
          const ctxAddress =
            (ctx.user as unknown as { verifiedAddresses?: { ethAddresses?: string[] } })
              .verifiedAddresses?.ethAddresses?.[0] ?? null;

          setProfile(p => ({
            ...p,
            fid,
            username: stored.username ?? (ctx.user.username as string | undefined) ?? 'you',
            displayName: (ctx.user as unknown as { displayName?: string }).displayName
              ?? (ctx.user.username as string | undefined)
              ?? 'CrafterZ Player',
            pfpUrl: (ctx.user as unknown as { pfpUrl?: string }).pfpUrl ?? null,
            pfpDataUrl: stored.pfpDataUrl ?? null,
            isOnFarcaster: true,
            walletAddress: ctxAddress,
          }));

          // Enrich with Neynar (server-proxied)
          try {
            const resp = await fetch(`/api/neynar/user?fid=${fid}`);
            if (resp.ok) {
              const data = await resp.json() as {
                ok: boolean; username: string; displayName: string;
                pfpUrl: string; bio: string | null;
                followerCount: number; followingCount: number;
                custodyAddress: string; verifications: string[];
              };
              if (data.ok) {
                setProfile(p => ({
                  ...p,
                  username: stored.username ?? data.username,
                  displayName: data.displayName,
                  pfpUrl: p.pfpDataUrl ? p.pfpUrl : data.pfpUrl,
                  bio: data.bio,
                  followerCount: data.followerCount,
                  followingCount: data.followingCount,
                  walletAddress: p.walletAddress ?? data.custodyAddress,
                  verifications: data.verifications,
                }));
              }
            }
          } catch { /* Neynar optional */ }
        } else {
          setProfile(p => ({
            ...p,
            isOnFarcaster: false,
            username: stored.username ?? 'you',
            pfpDataUrl: stored.pfpDataUrl ?? null,
          }));
        }
      } catch {
        setProfile(p => ({
          ...p,
          isOnFarcaster: false,
          username: stored.username ?? 'you',
          pfpDataUrl: stored.pfpDataUrl ?? null,
        }));
      } finally {
        setProfile(p => ({ ...p, isLoading: false }));
      }
    };

    void init();
  }, []);

  const updateUsername = useCallback((username: string) => {
    const trimmed = username.trim().slice(0, 20);
    setProfile(p => ({ ...p, username: trimmed || p.username }));
    saveStored({ username: trimmed });
  }, []);

  const updatePfp = useCallback((dataUrl: string) => {
    setProfile(p => ({ ...p, pfpDataUrl: dataUrl }));
    saveStored({ pfpDataUrl: dataUrl });
  }, []);

  const clearPfp = useCallback(() => {
    setProfile(p => ({ ...p, pfpDataUrl: null }));
    saveStored({ pfpDataUrl: null });
  }, []);

  const disconnectWallet = useCallback(() => {
    setProfile(p => ({ ...p, walletAddress: null }));
  }, []);

  return { profile, updateUsername, updatePfp, clearPfp, disconnectWallet };
}
