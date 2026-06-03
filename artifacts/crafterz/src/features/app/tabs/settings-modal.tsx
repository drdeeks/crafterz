import { useState, useRef } from 'react';
import type { UserProfile } from '../hooks/use-profile';
import type { WeatherEvent } from '../hooks/use-weather';

type SettingsTab = 'profile' | 'linked' | 'notifications' | 'display' | 'danger';

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1 pt-3 pb-1">{children}</p>;
}

function SettingsRow({ icon, label, sub, right }: { icon?: string; label: string; sub?: string; right: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
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

function NotifToggle({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        {sub && <p className="text-zinc-600 text-[10px] mt-0.5">{sub}</p>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(profile.username);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences
  const [notifs, setNotifs] = useState({
    discovery: true, heist: true, conference: false,
    gazette: true, agent: false, rental: true, weather: false,
  });
  const [farcasterAutoPost, setFarcasterAutoPost] = useState(false);

  // Display preferences
  const [sounds, setSounds] = useState(false);
  const [vibrations, setVibrations] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [exportDone, setExportDone] = useState(false);

  const avatarSrc = profile.pfpDataUrl ?? profile.pfpUrl
    ?? `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(profile.username)}`;

  function handlePfpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
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

  function handleExportData() {
    const data = {
      username: profile.username,
      fid: profile.fid,
      walletAddress: profile.walletAddress,
      craftz,
      myPoints,
      myRank,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crafterz-data-${profile.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'profile', label: 'Profile' },
    { id: 'linked', label: 'Accounts' },
    { id: 'notifications', label: 'Alerts' },
    { id: 'display', label: 'Display' },
    { id: 'danger', label: '⚠️ Danger' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-white transition-colors">
          <span className="text-base">←</span> Back
        </button>
        <span className="text-white text-sm font-semibold">Settings</span>
        <div className="w-16" />
      </div>

      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0 overflow-x-auto scrollbar-none">
        {settingsTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[60px] py-2.5 text-xs font-semibold whitespace-nowrap px-2 transition-colors ${activeTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-8 px-4">
        {activeTab === 'profile' && (
          <div className="space-y-2 pt-2">
            <div className="flex flex-col items-center pt-6 pb-4">
              <div className="relative mb-3">
                <img src={avatarSrc} className="w-20 h-20 rounded-full border-2 border-zinc-700 object-cover" alt="" />
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
                  >
                    ✕
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePfpChange} />

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
                <button onClick={() => { setUsernameDraft(profile.username); setEditingUsername(true); }} className="flex items-center gap-1.5 group mt-1">
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
                <p className="text-zinc-500 text-xs mt-2 text-center max-w-xs leading-relaxed">{profile.bio}</p>
              )}
              {profile.followerCount != null && (
                <div className="flex gap-4 mt-2">
                  <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{profile.followerCount.toLocaleString()}</span> followers</span>
                  <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{profile.followingCount?.toLocaleString()}</span> following</span>
                </div>
              )}
            </div>

            <SectionLabel>Public Stats</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '⚡', label: 'Craftz', value: `${craftz}/${craftzMax}` },
                { icon: '🏆', label: 'Points', value: myPoints.toLocaleString() },
                { icon: '🥇', label: 'Rank', value: `#${myRank}` },
              ].map((s) => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-base">{s.icon}</p>
                  <p className="text-white text-sm font-bold mt-1">{s.value}</p>
                  <p className="text-zinc-600 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>

            <SectionLabel>Status</SectionLabel>
            <SettingsRow icon="🤖" label="AI Crafting" right={
              <span className={aiEnabled ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
                {aiEnabled === null ? 'Checking…' : aiEnabled ? 'Enabled' : 'Offline'}
              </span>
            } />
            <SettingsRow icon="🧠" label="Active Agents" right={
              <span className={activeAgentCount > 0 ? 'text-violet-400 font-semibold' : ''}>{activeAgentCount > 0 ? `${activeAgentCount} hired` : 'None'}</span>
            } />
            {weatherEvent && (
              <SettingsRow icon={weatherEvent.icon} label="Weather" right={
                <span className="text-sm font-semibold" style={{ color: weatherEvent.colorHint }}>{weatherEvent.name}</span>
              } />
            )}

            <SectionLabel>Version</SectionLabel>
            <SettingsRow label="CrafterZ" right={<span className="text-zinc-600 text-sm font-mono">v1.1.0</span>} />
          </div>
        )}

        {activeTab === 'linked' && (
          <div className="space-y-2 pt-2">
            <SectionLabel>Farcaster</SectionLabel>
            {profile.isOnFarcaster ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">@{profile.username}</p>
                    <p className="text-zinc-600 text-xs">FID #{profile.fid} · Connected</p>
                  </div>
                  <span className="ml-auto text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5">🟣 Active</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
                <p className="text-zinc-500 text-sm">Open in Farcaster to connect your account.</p>
              </div>
            )}

            <SectionLabel>Wallet</SectionLabel>
            {profile.walletAddress ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <p className="text-white text-sm font-medium">Wallet connected</p>
                  </div>
                  <span className="text-zinc-400 text-xs font-mono">{formatWallet(profile.walletAddress)}</span>
                </div>
                <button onClick={onDisconnectWallet} className="text-red-500 text-xs hover:text-red-400 transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
                <p className="text-zinc-500 text-sm">No wallet connected.</p>
                <p className="text-zinc-700 text-xs mt-0.5">Connect via Farcaster or WalletConnect.</p>
              </div>
            )}

            {profile.verifications.length > 0 && (
              <>
                <SectionLabel>Verified Addresses</SectionLabel>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 space-y-1.5">
                  {profile.verifications.slice(0, 5).map((v) => (
                    <p key={v} className="text-zinc-400 text-[10px] font-mono">{v.slice(0, 10)}…{v.slice(-8)}</p>
                  ))}
                </div>
              </>
            )}

            <SectionLabel>Registered Agents</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <p className="text-zinc-500 text-sm">No ERC-8004 agents linked to this account.</p>
              <p className="text-zinc-700 text-xs mt-0.5">Use "Enter as Agent Owner" to register an agent.</p>
            </div>

            <SectionLabel>Social Logins</SectionLabel>
            <div className="space-y-2">
              {[
                { icon: '🟣', name: 'Farcaster', status: profile.isOnFarcaster ? 'Connected' : 'Not connected', connected: profile.isOnFarcaster },
                { icon: '🔵', name: 'Google', status: 'Not connected', connected: false },
                { icon: '⚫', name: 'Apple', status: 'Not connected', connected: false },
              ].map((item) => (
                <div key={item.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span>{item.icon}</span>
                    <span className="text-white text-sm">{item.name}</span>
                  </div>
                  <span className={`text-xs ${item.connected ? 'text-emerald-400' : 'text-zinc-600'}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-2 pt-2">
            <SectionLabel>In-App Notifications</SectionLabel>
            <NotifToggle label="Discoveries" sub="When you or others make new discoveries" on={notifs.discovery} onToggle={() => setNotifs(n => ({ ...n, discovery: !n.discovery }))} />
            <NotifToggle label="Heist Alerts" sub="When a heist is initiated against your MegaMinds" on={notifs.heist} onToggle={() => setNotifs(n => ({ ...n, heist: !n.heist }))} />
            <NotifToggle label="Conference Alerts" sub="When a conference is starting soon" on={notifs.conference} onToggle={() => setNotifs(n => ({ ...n, conference: !n.conference }))} />
            <NotifToggle label="Gazette Features" sub="When you appear in the Daily Gazette" on={notifs.gazette} onToggle={() => setNotifs(n => ({ ...n, gazette: !n.gazette }))} />
            <NotifToggle label="Agent Activity" sub="When your rented agent completes a task" on={notifs.agent} onToggle={() => setNotifs(n => ({ ...n, agent: !n.agent }))} />
            <NotifToggle label="Rental Income" sub="When rental earnings are claimable" on={notifs.rental} onToggle={() => setNotifs(n => ({ ...n, rental: !n.rental }))} />
            <NotifToggle label="Weather Events" sub="When a major weather event begins" on={notifs.weather} onToggle={() => setNotifs(n => ({ ...n, weather: !n.weather }))} />

            <SectionLabel>Farcaster</SectionLabel>
            <NotifToggle
              label="Auto-post notable events"
              sub="Share discoveries and milestones as Farcaster casts"
              on={farcasterAutoPost}
              onToggle={() => setFarcasterAutoPost(v => !v)}
            />

            <SectionLabel>Email Digest</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <p className="text-zinc-500 text-sm">Email digest is not available in mini-app mode.</p>
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="space-y-2 pt-2">
            <SectionLabel>Interface</SectionLabel>
            <NotifToggle label="Sound Effects" on={sounds} onToggle={() => setSounds(v => !v)} />
            <NotifToggle label="Haptic Feedback" sub="Vibration on actions (mobile)" on={vibrations} onToggle={() => setVibrations(v => !v)} />
            <NotifToggle label="Compact Mode" sub="Smaller item cards in inventory" on={compactMode} onToggle={() => setCompactMode(v => !v)} />

            <SectionLabel>Theme</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <p className="text-zinc-400 text-sm">Dark mode only · Optimized for OLED displays</p>
            </div>

            <SectionLabel>About</SectionLabel>
            <SettingsRow label="Version" right={<span className="font-mono text-xs text-zinc-600">1.1.0 · ERC-8004</span>} />
            <SettingsRow label="Blueprint" right={<span className="font-mono text-xs text-zinc-600">v1.1</span>} />
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
              <p className="text-zinc-600 text-xs leading-relaxed">
                CrafterZ runs on Base · Agents use ERC-8004 identity standard · Discoveries are permanent on-chain records
              </p>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-2 pt-2">
            <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4 mt-2 mb-2">
              <p className="text-red-400 text-sm font-semibold">⚠️ Danger Zone</p>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">Actions here are irreversible or have a mandatory delay. Read carefully before proceeding.</p>
            </div>

            <SectionLabel>Reset Onboarding</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 space-y-2">
              <p className="text-zinc-300 text-sm">Replay the intro flow</p>
              <p className="text-zinc-600 text-xs">Clears the onboarding-complete flag locally. Your profile, points, and inventory are unaffected.</p>
              <button
                onClick={() => {
                  try { localStorage.removeItem('crafterz_onboarding_done'); } catch {}
                  window.location.reload();
                }}
                className="w-full mt-2 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                🔄 Reset Onboarding
              </button>
            </div>

            <SectionLabel>Data Export (GDPR)</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 space-y-2">
              <p className="text-zinc-300 text-sm">Export all your CrafterZ profile data as a JSON file.</p>
              <p className="text-zinc-600 text-xs">This does not affect your on-chain assets or agent NFTs.</p>
              <button
                onClick={handleExportData}
                className="w-full mt-2 py-2 rounded-xl bg-zinc-700 text-white text-sm font-semibold hover:bg-zinc-600 transition-colors"
              >
                {exportDone ? '✓ Downloaded' : '📥 Export My Data'}
              </button>
            </div>

            <SectionLabel>Account Deletion</SectionLabel>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 space-y-3">
              <p className="text-zinc-300 text-sm font-medium">Delete CrafterZ Account</p>
              <div className="space-y-1.5">
                <p className="text-zinc-500 text-xs">• Your CrafterZ profile will be soft-deleted</p>
                <p className="text-zinc-500 text-xs">• 7-day grace period — you can cancel within this window</p>
                <p className="text-zinc-500 text-xs">• After 7 days, account data is permanently removed</p>
                <p className="text-zinc-500 text-xs text-amber-400">• NFTs, on-chain assets, and agent records are NOT deleted — they remain on Base</p>
              </div>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full py-2 rounded-xl border border-red-800 text-red-400 text-sm font-semibold hover:bg-red-950/30 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-zinc-400 text-xs">Type your username to confirm:</p>
                  <input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={`Type "${profile.username}"`}
                    className="w-full bg-zinc-800 border border-red-800/50 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
                      Cancel
                    </button>
                    <button
                      disabled={deleteInput !== profile.username}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${deleteInput === profile.username ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                    >
                      Confirm Delete
                    </button>
                  </div>
                  <p className="text-zinc-700 text-[10px] text-center">A 24-hour delay applies before deletion begins.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
