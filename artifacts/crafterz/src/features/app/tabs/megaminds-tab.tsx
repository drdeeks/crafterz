import { useState } from 'react';
import type { AppInventoryItem } from '../app-types';
import type { ServerHeist } from '../runtime-api';

type HeistSubTab = 'mine' | 'active' | 'initiate' | 'history';

interface HeistResult {
  heist: ServerHeist;
  pointsAwarded: number;
}

const HEIST_COST = 50;

const SAFE_HARBOR_HOURS = 24;
const HEIST_RULES = [
  `New MegaMinds are protected for ${SAFE_HARBOR_HOURS}h after discovery (Safe Harbor)`,
  'Max 3 heists you can initiate per 24-hour window',
  'Max 2 simultaneous active defense heists',
  'Outcome: 30% agent skill · 50% craft-off · 20% variance',
  'Results are final. No appeals. The Archive records historically significant outcomes.',
];

const HEIST_HISTORY_SAMPLE = [
  {
    id: 'h1',
    role: 'attacker' as const,
    outcome: 'win' as const,
    itemName: 'Luminescent Potato',
    opponentUsername: 'bot_opponent',
    pointsAwarded: 15,
    occurredAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
  },
  {
    id: 'h2',
    role: 'attacker' as const,
    outcome: 'loss' as const,
    itemName: 'Crystallized Thunder',
    opponentUsername: 'bot_opponent',
    pointsAwarded: 0,
    occurredAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
  },
];

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MegaMindsTab({
  megaMindItems,
  inventory,
  tierBadge,
  craftz,
  onStartMint,
  onInitiateHeist,
}: {
  megaMindItems: AppInventoryItem[];
  inventory: AppInventoryItem[];
  tierBadge: Record<string, string>;
  craftz: number;
  onStartMint: (item: AppInventoryItem) => void;
  onInitiateHeist: (
    target: AppInventoryItem,
    weapon: AppInventoryItem,
  ) => Promise<HeistResult | null>;
}) {
  const [subTab, setSubTab] = useState<HeistSubTab>('mine');
  const [heistTarget, setHeistTarget] = useState<AppInventoryItem | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<AppInventoryItem | null>(null);
  const [heistResult, setHeistResult] = useState<HeistResult | null>(null);
  const [heistLoading, setHeistLoading] = useState(false);

  const weaponChoices = inventory.filter((i) => !i.isMegaMind && i.tier !== 'GENESIS');

  async function startHeist() {
    if (!heistTarget || !selectedWeapon) return;
    setHeistLoading(true);
    try {
      const result = await onInitiateHeist(heistTarget, selectedWeapon);
      setHeistResult(result);
    } finally {
      setHeistLoading(false);
    }
  }

  function resetHeist() {
    setHeistTarget(null);
    setSelectedWeapon(null);
    setHeistResult(null);
  }

  const subTabs: Array<{ id: HeistSubTab; label: string }> = [
    { id: 'mine', label: `💎 Mine${megaMindItems.length > 0 ? ` (${megaMindItems.length})` : ''}` },
    { id: 'active', label: '⚔️ Active' },
    { id: 'initiate', label: '🗡 Challenge' },
    { id: 'history', label: '📜 History' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0 overflow-x-auto scrollbar-none">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSubTab(t.id); if (t.id !== 'initiate') resetHeist(); }}
            className={`flex-1 min-w-[70px] py-2.5 text-[10px] font-semibold whitespace-nowrap px-2 transition-colors ${subTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {subTab === 'mine' && (
          <div className="p-3 space-y-3">
            {megaMindItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl opacity-30">⚡</span>
                <p className="text-zinc-500 text-sm">No MegaMinds yet</p>
                <p className="text-zinc-700 text-xs text-center leading-relaxed">
                  Craft an item no one on the platform<br />has ever created — that's a MegaMind.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-2 max-w-xs text-center">
                  <p className="text-zinc-500 text-xs leading-relaxed">First discoveries earn a permanent on-chain badge. Mint it as an NFT to prove you were first.</p>
                </div>
              </div>
            ) : (
              megaMindItems.map((item) => (
                <div key={item.uid} className={`rounded-xl border p-4 flex items-center gap-4 ${item.isMinted ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-amber-950/15 border-amber-500/25'}`}>
                  <div className="relative flex-shrink-0">
                    <span className="text-4xl">{item.emoji}</span>
                    {item.isMinted && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">✓</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tierBadge[item.tier]}`}>{item.tier}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">⚡ MEGAMIND</span>
                    </div>
                    {item.isMinted && item.tokenId && (
                      <div className="mt-1">
                        <p className="text-zinc-600 text-xs">Token #{item.tokenId}</p>
                        {item.txHash && (
                          <a href={`https://basescan.org/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-[10px] hover:text-blue-300 underline underline-offset-2">
                            {item.txHash.slice(0, 10)}…{item.txHash.slice(-6)} ↗
                          </a>
                        )}
                      </div>
                    )}
                    <div className="mt-1">
                      <p className="text-zinc-700 text-[10px]">
                        🛡 Safe Harbor: {SAFE_HARBOR_HOURS}h protection from heists after discovery
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    {item.isMinted ? (
                      <>
                        <p className="text-amber-400 font-bold text-sm">25 pts</p>
                        <span className="text-emerald-400 text-xs">✓ On-chain</span>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-400 font-bold text-sm">10 pts</p>
                        <button onClick={() => onStartMint(item)} className="bg-amber-400 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
                          🎨 Mint
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {subTab === 'active' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-zinc-500 text-xs">Active heist challenges</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-600 text-[10px]">Live</span>
              </div>
            </div>

            <div className="text-center py-12">
              <p className="text-3xl mb-3">🛡</p>
              <p className="text-zinc-500 text-sm">No active heists</p>
              <p className="text-zinc-700 text-xs mt-1 leading-relaxed">
                Heists you've initiated or are defending against<br />will appear here in real time.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Defend Rules</p>
              <div className="space-y-1">
                <p className="text-zinc-600 text-[10px]">• Max 2 simultaneous active defense heists</p>
                <p className="text-zinc-600 text-[10px]">• Defenders receive a timed crafting puzzle</p>
                <p className="text-zinc-600 text-[10px]">• Assign your best agent to defend</p>
                <p className="text-zinc-600 text-[10px]">• Timeout = attacker wins by default</p>
              </div>
            </div>
          </div>
        )}

        {subTab === 'initiate' && (
          <div className="p-3 space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">⚔️ Challenge a MegaMind</p>
              <p className="text-zinc-400 text-xs leading-relaxed mb-2">
                Challenge another player's MegaMind badge. Win to claim their first-discovery status. Costs {HEIST_COST} Craftz to initiate.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Your Craftz:</span>
                <span className={`text-xs font-bold ${craftz >= HEIST_COST ? 'text-amber-400' : 'text-red-400'}`}>{craftz} ⚡</span>
                {craftz < HEIST_COST && <span className="text-red-400 text-[10px]">(Need {HEIST_COST})</span>}
              </div>
            </div>

            {!heistTarget && !heistResult && (
              <div>
                <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Your MegaMinds (select target)</p>
                {megaMindItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-600 text-xs">You need at least one MegaMind to initiate a heist.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {megaMindItems.map((item) => (
                      <button
                        key={item.uid}
                        onClick={() => { setHeistTarget(item); setSelectedWeapon(null); }}
                        className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-3 py-2.5 text-left transition-colors"
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium">{item.name}</p>
                          <p className="text-zinc-600 text-[10px]">{item.tier} · Challenge bot opponent for practice</p>
                        </div>
                        <span className="text-zinc-500 text-xs">⚔ Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {heistTarget && !heistResult && (
              <div className="space-y-3">
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-bold text-xs">⚔ Challenge for <span className="text-amber-400">{heistTarget.name}</span></p>
                    <span className="text-zinc-600 text-[10px]">Cost: {HEIST_COST} ⚡</span>
                  </div>
                  <p className="text-zinc-500 text-[11px]">Select a crafted item as your weapon. Higher tier = better odds.</p>
                </div>

                {weaponChoices.length === 0 ? (
                  <p className="text-zinc-600 text-xs italic text-center py-4">Craft some non-genesis items first to use as weapons.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {weaponChoices.slice(0, 8).map((w) => (
                      <button
                        key={w.uid}
                        onClick={() => setSelectedWeapon(selectedWeapon?.uid === w.uid ? null : w)}
                        className={`rounded-xl border p-2.5 flex items-center gap-2 text-left transition-colors ${selectedWeapon?.uid === w.uid ? 'bg-amber-900/30 border-amber-500/50' : 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-700/60'}`}
                      >
                        <span className="text-lg leading-none">{w.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-white text-[11px] font-semibold truncate">{w.name}</p>
                          <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${tierBadge[w.tier]}`}>{w.tier}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={resetHeist} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-semibold hover:bg-zinc-800 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => void startHeist()}
                    disabled={!selectedWeapon || heistLoading || craftz < HEIST_COST}
                    className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {heistLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Resolving…
                      </span>
                    ) : craftz < HEIST_COST ? `Need ${HEIST_COST} ⚡` : '⚔️ Launch Heist'}
                  </button>
                </div>
              </div>
            )}

            {heistResult && (
              <div className="rounded-xl border p-4 space-y-2 text-center bg-zinc-900 border-zinc-700">
                <p className="text-3xl">{heistResult.heist.winnerFid === heistResult.heist.challengerFid ? '🏆' : '💀'}</p>
                <p className={`font-bold text-lg ${heistResult.heist.winnerFid === heistResult.heist.challengerFid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {heistResult.heist.winnerFid === heistResult.heist.challengerFid ? 'Victory' : 'Defeated'}
                </p>
                <div className="text-xs text-zinc-400 space-y-0.5">
                  <p>Your {heistResult.heist.challengerItemName} ({heistResult.heist.challengerItemTier}) vs</p>
                  <p>{heistResult.heist.defenderUsername}'s {heistResult.heist.defenderItemName} ({heistResult.heist.defenderItemTier})</p>
                </div>
                {heistResult.pointsAwarded > 0 && (
                  <p className="text-amber-400 font-bold text-sm">+{heistResult.pointsAwarded} pts earned</p>
                )}
                {heistResult.heist.rivalryTokenEarned && (
                  <p className="text-purple-400 text-xs font-semibold">🎖 Rivalry Token Earned!</p>
                )}
                <div className="text-zinc-600 text-[10px] mt-1">
                  Outcome: {heistResult.heist.status} · Result is final and may be archived if historically significant.
                </div>
                <button onClick={resetHeist} className="mt-1 w-full py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                  Done
                </button>
              </div>
            )}

            {!heistTarget && !heistResult && (
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
                <p className="text-zinc-500 text-xs font-semibold mb-2">Heist Rules</p>
                {HEIST_RULES.map((rule, i) => (
                  <p key={i} className="text-zinc-600 text-[10px] mb-1">• {rule}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'history' && (
          <div className="p-3 space-y-3">
            <p className="text-zinc-500 text-xs px-1">All heists you've participated in</p>

            {HEIST_HISTORY_SAMPLE.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">📜</p>
                <p className="text-zinc-500 text-sm">No heist history yet</p>
                <p className="text-zinc-700 text-xs mt-1">Completed heists will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {HEIST_HISTORY_SAMPLE.map((h) => (
                  <div key={h.id} className={`bg-zinc-900 border rounded-xl px-4 py-3 ${h.outcome === 'win' ? 'border-emerald-800/40' : 'border-red-900/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{h.outcome === 'win' ? '🏆' : '💀'}</span>
                        <span className={`text-sm font-bold ${h.outcome === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.outcome === 'win' ? 'Win' : 'Loss'}
                        </span>
                        <span className="text-zinc-600 text-[10px]">{h.role === 'attacker' ? 'Attacker' : 'Defender'}</span>
                      </div>
                      <span className="text-zinc-600 text-[10px]">{formatDateShort(h.occurredAt)}</span>
                    </div>
                    <p className="text-zinc-300 text-xs">{h.itemName}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">vs {h.opponentUsername}</p>
                    {h.pointsAwarded > 0 && (
                      <p className="text-amber-400 text-xs font-semibold mt-1">+{h.pointsAwarded} pts</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-600 text-[10px] leading-relaxed">
                Historically significant heists (items held 7+ days) are permanently recorded in the Great Archive. All heist outcomes are final.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
