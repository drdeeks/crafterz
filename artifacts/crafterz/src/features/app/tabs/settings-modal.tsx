import { useState, useRef } from 'react';
import type { UserProfile } from '../hooks/use-profile';
import type { WeatherEvent } from '../hooks/use-weather';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-violet-600' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function Row({ label, right, icon, sub }: { label: string; right: React.ReactNode; icon?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
      <span className="text-white text-sm font-medium flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-base flex-shrink-0">{icon}</span>}
        <span className="min-w-0">
          {label}
          {sub && <span className="block text-zinc-600 text-[10px] font-normal mt-0.5">{sub}</span>}
        </span>
      </span>
      <span className="text-zinc-400 text-sm ml-3 flex-shrink-0">{right}</span>
    </div>
  );
}

export function SettingsModal({
  onClose,
  profile,
  onUpdateUsername,
  onUpdatePfp,
  onClearPfp,
  onDisconnectWallet,
  craftz,
  craftzMax,
  aiEnabled,
  weatherEvent,
  activeAgentCount,
  myPoints,
  myRank,
}: {
  onClose: () => void;
  profile: UserProfile;
  onUpdateUsername: (username: string) => void;
  onUpdatePfp: (dataUrl: string) => void;
  onClearPfp: () => void;
  onDisconnectWallet: () => void;
  craftz: number;
  craftzMax: number;
  aiEnabled: boolean | null;
  weatherEvent?: WeatherEvent | null;
  activeAgentCount: number;
  myPoints: number;
  myRank: number | string;
}) {
  const [sounds, setSounds] = useState(false);
  const [vibrations, setVibrations] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(profile.username);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = profile.pfpDataUrl ?? profile.pfpUrl
    ?? `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(profile.username)}`;

  function handlePfpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') onUpdatePfp(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function submitUsername() {
    const trimmed = usernameDraft.trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 20);
    if (trimmed) onUpdateUsername(trimmed);
    setEditingUsername(false);
  }

  function formatWallet(addr: string) {
    return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-white transition-colors">
          <span className="text-base">←</span> Back
        </button>
        {profile.isOnFarcaster && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
            🟣 Farcaster
          </span>
        )}
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Avatar + identity */}
        <div className="flex flex-col items-center pt-8 pb-5">
          <div className="relative mb-3">
            <img
              src={avatarSrc}
              className="w-20 h-20 rounded-full border-2 border-zinc-700 object-cover"
              alt=""
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-sm hover:bg-zinc-700 transition-colors"
              title="Change photo"
            >
              📷
            </button>
            {profile.pfpDataUrl && (
              <button
                onClick={onClearPfp}
                className="absolute top-0 right-0 w-5 h-5 bg-red-900/80 border border-red-700/60 rounded-full flex items-center justify-center text-[10px] hover:bg-red-800 transition-colors"
                title="Remove custom photo"
              >
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePfpChange}
          />

          {/* Username */}
          {editingUsername ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                maxLength={20}
                className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-zinc-400 w-40"
                placeholder="username"
              />
              <button onClick={submitUsername} className="text-emerald-400 text-sm font-semibold hover:text-emerald-300">✓</button>
              <button onClick={() => setEditingUsername(false)} className="text-zinc-500 text-sm hover:text-zinc-300">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setUsernameDraft(profile.username); setEditingUsername(true); }}
              className="flex items-center gap-1.5 group mt-1"
            >
              <span className="text-white font-bold text-lg">@{profile.username}</span>
              <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">✏️</span>
            </button>
          )}

          {profile.displayName && profile.displayName !== profile.username && (
            <p className="text-zinc-500 text-xs mt-0.5">{profile.displayName}</p>
          )}
          {profile.isOnFarcaster && profile.fid && (
            <p className="text-zinc-600 text-[10px] mt-0.5">FID #{profile.fid}</p>
          )}
          {profile.bio && (
            <p className="text-zinc-500 text-xs mt-2 text-center max-w-xs px-4 leading-relaxed">{profile.bio}</p>
          )}
          {profile.followerCount != null && (
            <div className="flex gap-4 mt-2">
              <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{profile.followerCount.toLocaleString()}</span> followers</span>
              <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{profile.followingCount?.toLocaleString()}</span> following</span>
            </div>
          )}
        </div>

        <div className="px-4 space-y-2">
          {/* Stats */}
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1 pt-1">Stats</p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium flex items-center gap-2.5">
              <span className="text-base">⚡</span> Craftz Energy
            </span>
            <span className="text-zinc-400 text-sm font-mono">{craftz} / {craftzMax}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium flex items-center gap-2.5">
              <span className="text-base">🏆</span> Rank
            </span>
            <span className="text-amber-400 text-sm font-bold">#{myRank} · {myPoints.toLocaleString()} pts</span>
          </div>

          <Row icon="🧠" label="Active Agents" right={
            <span className={activeAgentCount > 0 ? 'text-violet-400 font-semibold' : ''}>{activeAgentCount > 0 ? `${activeAgentCount} hired` : 'None'}</span>
          } />

          <Row icon="🤖" label="AI Crafting" right={
            <span className={aiEnabled ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
              {aiEnabled === null ? 'Checking…' : aiEnabled ? 'Enabled' : 'Offline'}
            </span>
          } />

          {weatherEvent && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <span className="text-white text-sm font-medium flex items-center gap-2.5">
                <span className="text-base">{weatherEvent.icon}</span> Weather
              </span>
              <span className="text-sm font-semibold" style={{ color: weatherEvent.colorHint }}>{weatherEvent.name}</span>
            </div>
          )}

          {/* Wallet */}
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1 pt-3">Wallet</p>

          {profile.walletAddress ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  Wallet connected
                </span>
                <span className="text-zinc-400 text-xs font-mono">{formatWallet(profile.walletAddress)}</span>
              </div>
              <button
                onClick={onDisconnectWallet}
                className="text-red-500 text-xs hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Row icon="🔌" label="No wallet connected" right={<span className="text-zinc-600 text-xs">—</span>} />
          )}

          {/* Verifications */}
          {profile.verifications.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 space-y-1.5">
              <p className="text-white text-sm font-medium">Verified Addresses</p>
              {profile.verifications.slice(0, 3).map((v) => (
                <p key={v} className="text-zinc-500 text-[10px] font-mono">{v.slice(0, 8)}…{v.slice(-6)}</p>
              ))}
            </div>
          )}

          {/* Preferences */}
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1 pt-3">Preferences</p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium">Sounds</span>
            <Toggle on={sounds} onToggle={() => setSounds((v) => !v)} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium">Vibrations</span>
            <Toggle on={vibrations} onToggle={() => setVibrations((v) => !v)} />
          </div>

          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1 pt-3">Info</p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium">Guide & Chat</span>
            <span className="text-zinc-600 text-base">›</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium">Version</span>
            <span className="text-zinc-600 text-sm font-mono">1.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
