import { useState } from 'react';
import type { WeatherEvent } from '../hooks/use-weather';

function Row({ label, right, icon }: { label: string; right: React.ReactNode; icon?: string }) {
  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
      <span className="text-white text-sm font-medium flex items-center gap-2.5">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </span>
      <span className="text-zinc-400 text-sm">{right}</span>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-violet-600' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function SettingsModal({
  onClose,
  username,
  craftz,
  craftzMax,
  aiEnabled,
  weatherEvent,
  activeAgentCount,
  myPoints,
  myRank,
}: {
  onClose: () => void;
  username: string;
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
  const [autoAgents, setAutoAgents] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-white transition-colors">
          <span className="text-base">←</span> Back
        </button>
        <span className="text-zinc-500 text-xs">@{username}</span>
        <div className="w-16" />
      </div>

      {/* Avatar + title */}
      <div className="flex flex-col items-center pt-8 pb-6 flex-shrink-0">
        <img
          src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${username}`}
          className="w-16 h-16 rounded-full border-2 border-zinc-700 mb-3"
          alt=""
        />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
        {/* Stats block */}
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

        <Row
          icon="🧠"
          label="Active Agents"
          right={
            <span className={activeAgentCount > 0 ? 'text-violet-400 font-semibold' : ''}>
              {activeAgentCount > 0 ? `${activeAgentCount} hired` : 'None'}
            </span>
          }
        />

        <Row
          icon="🤖"
          label="AI Crafting"
          right={
            <span className={aiEnabled ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
              {aiEnabled === null ? 'Checking…' : aiEnabled ? 'Enabled' : 'Offline'}
            </span>
          }
        />

        {weatherEvent && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-white text-sm font-medium flex items-center gap-2.5">
              <span className="text-base">{weatherEvent.icon}</span> Weather
            </span>
            <span className="text-sm font-semibold" style={{ color: weatherEvent.colorHint }}>{weatherEvent.name}</span>
          </div>
        )}

        <div className="mt-2 mb-1">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1">Preferences</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Auto-Hire Agents</span>
          <Toggle on={autoAgents} onToggle={() => setAutoAgents((v) => !v)} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Sounds</span>
          <Toggle on={sounds} onToggle={() => setSounds((v) => !v)} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Vibrations</span>
          <Toggle on={vibrations} onToggle={() => setVibrations((v) => !v)} />
        </div>

        <div className="mt-2 mb-1">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-1">Info</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Guide & Docs</span>
          <span className="text-zinc-600 text-base">›</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-white text-sm font-medium">Version</span>
          <span className="text-zinc-600 text-sm font-mono">1.0.0</span>
        </div>
      </div>
    </div>
  );
}
