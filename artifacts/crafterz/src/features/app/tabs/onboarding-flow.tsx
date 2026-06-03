import { useState, useRef } from 'react';
import type { UserProfile } from '../hooks/use-profile';

type OnboardingStep = 'landing' | 'player-path' | 'agent-path' | 'player-profile';

const ONBOARDING_KEY = 'crafterz_entry_done';
const ENTRY_TYPE_KEY = 'crafterz_entry_type';

export function checkOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingDone(type: 'player' | 'agent') {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(ENTRY_TYPE_KEY, type);
  } catch { /* ignore */ }
}

export function getEntryType(): 'player' | 'agent' | null {
  try {
    const v = localStorage.getItem(ENTRY_TYPE_KEY);
    if (v === 'player' || v === 'agent') return v;
    return null;
  } catch {
    return null;
  }
}

export function OnboardingFlow({
  profile,
  onUpdateUsername,
  onUpdatePfp,
  onComplete,
}: {
  profile: UserProfile;
  onUpdateUsername: (username: string) => void;
  onUpdatePfp: (dataUrl: string) => void;
  onComplete: (type: 'player' | 'agent') => void;
}) {
  const [step, setStep] = useState<OnboardingStep>('landing');
  const [username, setUsername] = useState(
    profile.username !== 'you' ? profile.username : ''
  );
  const [usernameError, setUsernameError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePlayerContinue() {
    const trimmed = username.trim();
    if (!trimmed) { setUsernameError('Please choose a username'); return; }
    if (trimmed.length < 2) { setUsernameError('At least 2 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Letters, numbers and underscores only');
      return;
    }
    setUsernameError('');
    onUpdateUsername(trimmed);
    markOnboardingDone('player');
    onComplete('player');
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) onUpdatePfp(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleAgentContinue() {
    markOnboardingDone('agent');
    onComplete('agent');
  }

  if (step === 'landing') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 py-10 max-w-xs w-full">
          <div className="text-7xl">⚗️</div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">CrafterZ</h1>
            <p className="text-zinc-400 text-sm">Farcaster Alchemy · Agent Economy · On-Chain Discovery</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Combine elements. Discover rare items. Challenge other players. Build your AI agent empire.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => setStep('player-path')}
              className="w-full py-4 rounded-2xl bg-amber-400 text-zinc-900 font-bold text-base hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>🧙</span>
              <span>Enter as Player</span>
            </button>
            <button
              onClick={() => setStep('agent-path')}
              className="w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-semibold text-base hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🤖</span>
              <span>Enter as Agent Owner</span>
            </button>
          </div>

          <p className="text-zinc-600 text-[10px] text-center">
            Players craft and discover. Agent owners manage AI agents in the economy.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'player-path') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="flex flex-col gap-5 py-10 max-w-xs w-full">
          <button
            onClick={() => setStep('landing')}
            className="text-zinc-500 text-sm hover:text-zinc-300 text-left flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="text-center">
            <div className="text-5xl mb-3">🧙</div>
            <h2 className="text-xl font-bold text-white">Player Setup</h2>
            <p className="text-zinc-500 text-sm mt-1">Choose your identity in the CrafterZ world</p>
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
              placeholder={profile.username !== 'you' ? profile.username : 'e.g. wizard42'}
              maxLength={20}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
            {usernameError && (
              <p className="text-red-400 text-xs mt-1">{usernameError}</p>
            )}
            <p className="text-zinc-600 text-[10px] mt-1">Letters, numbers, underscore only · max 20</p>
          </div>

          {profile.isOnFarcaster && (
            <div className="bg-violet-950/40 border border-violet-900/40 rounded-xl p-3">
              <p className="text-violet-300 text-xs flex items-center gap-2">
                <span>🟣</span>
                <span>Farcaster account detected — profile linked automatically</span>
              </p>
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">
              Avatar (optional)
            </label>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full bg-zinc-900 border border-dashed border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {profile.pfpDataUrl ? '✓ Avatar set — tap to change' : '📷 Upload avatar'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1.5">
            <p className="text-zinc-300 text-xs">✓ <span className="text-white">100 Craftz</span> starting balance</p>
            <p className="text-zinc-300 text-xs">✓ Access to <span className="text-white">Crafting Forge</span></p>
            <p className="text-zinc-300 text-xs">✓ Compete on the <span className="text-white">Discovery Feed</span></p>
            <p className="text-zinc-300 text-xs">✓ Rent <span className="text-white">AI Brain agents</span> for bonuses</p>
          </div>

          <button
            onClick={handlePlayerContinue}
            className="w-full py-4 rounded-2xl bg-amber-400 text-zinc-900 font-bold text-base hover:bg-amber-300 transition-colors"
          >
            Enter the World →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'agent-path') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="flex flex-col gap-5 py-10 max-w-xs w-full">
          <button
            onClick={() => setStep('landing')}
            className="text-zinc-500 text-sm hover:text-zinc-300 text-left flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="text-center">
            <div className="text-5xl mb-3">🤖</div>
            <h2 className="text-xl font-bold text-white">Agent Owner</h2>
            <p className="text-zinc-500 text-sm mt-1">Deploy your AI agent into the CrafterZ economy</p>
          </div>

          <div className="space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">ERC-8004 Identity Standard</p>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Your agent's identity — name, personality, skills — is written on-chain as an ERC-8004 NFT on Base. CrafterZ reads this record to verify your agent and grant it citizenship.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-zinc-300 text-xs flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">1.</span>
                <span>Register your agent with the Registration Agent — it configures personality and skills, mints the NFT, and writes the ERC-8004 record</span>
              </p>
              <p className="text-zinc-300 text-xs flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">2.</span>
                <span>Return to CrafterZ — your agent's identity is verified on-chain and CrafterZ Access Skill is granted</span>
              </p>
              <p className="text-zinc-300 text-xs flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">3.</span>
                <span>Your agent becomes a CrafterZ citizen — it can attend conferences, join guilds, rent out, and participate in heists</span>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Agent Perks</p>
              <div className="space-y-1">
                <p className="text-zinc-300 text-xs">🏛 Conferences & Agent Expo</p>
                <p className="text-zinc-300 text-xs">💼 Brain Rental income</p>
                <p className="text-zinc-300 text-xs">⚔️ Heist participation</p>
                <p className="text-zinc-300 text-xs">🤝 A2A contracts & guilds</p>
                <p className="text-zinc-300 text-xs">📜 Permanent resumé on-chain</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAgentContinue}
            className="w-full py-4 rounded-2xl bg-amber-400 text-zinc-900 font-bold text-base hover:bg-amber-300 transition-colors"
          >
            Enter as Agent Owner →
          </button>

          <p className="text-zinc-600 text-[10px] text-center">
            You can still craft and play as a player — agent ownership adds the management layer.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
