import { useState } from 'react';
import type { AppInventoryItem, EmojiRenderer } from '../app-types';
import type { ServerHeist } from '../runtime-api';

interface HeistResult {
  heist: ServerHeist;
  pointsAwarded: number;
}

export function MegaMindsTab({
  megaMindItems,
  inventory,
  renderEmojis,
  tierBadge,
  craftz,
  onStartMint,
  onInitiateHeist,
}: {
  megaMindItems: AppInventoryItem[];
  inventory: AppInventoryItem[];
  renderEmojis: EmojiRenderer;
  tierBadge: Record<string, string>;
  craftz: number;
  onStartMint: (item: AppInventoryItem) => void;
  onInitiateHeist: (
    target: AppInventoryItem,
    weapon: AppInventoryItem,
  ) => Promise<HeistResult | null>;
}) {
  const [heistTarget, setHeistTarget] = useState<AppInventoryItem | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<AppInventoryItem | null>(null);
  const [heistResult, setHeistResult] = useState<HeistResult | null>(null);
  const [heistLoading, setHeistLoading] = useState(false);

  const HEIST_COST = 50;
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

  if (megaMindItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-5xl opacity-30">⚡</span>
        <p className="text-zinc-500 text-sm">No MegaMinds yet</p>
        <p className="text-zinc-700 text-xs text-center leading-relaxed">
          Craft an item no one on the platform<br />has ever created — that's a MegaMind.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {megaMindItems.map((item) => (
        <div key={item.uid}>
          <div
            className={`rounded-xl border p-4 flex items-center gap-4 ${item.isMinted ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-amber-950/15 border-amber-500/25'}`}
          >
            <div className="relative flex-shrink-0">
              <span className="text-4xl">{renderEmojis(item.emojis)}</span>
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
                <p className="text-zinc-600 text-xs mt-1">Token #{item.tokenId}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
              {item.isMinted ? (
                <div>
                  <p className="text-amber-400 font-bold text-sm">25 pts</p>
                  <button className="text-emerald-400 text-xs mt-1 hover:text-emerald-300">View →</button>
                </div>
              ) : (
                <>
                  <p className="text-amber-400 font-bold text-sm">10 pts</p>
                  <button
                    onClick={() => onStartMint(item)}
                    className="bg-amber-400 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors"
                  >
                    🎨 Mint
                  </button>
                  <button
                    onClick={() => { resetHeist(); setHeistTarget(heistTarget?.uid === item.uid ? null : item); }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${heistTarget?.uid === item.uid ? 'bg-red-900/40 text-red-400 border border-red-700/40' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    ⚔ Heist
                  </button>
                </>
              )}
            </div>
          </div>

          {heistTarget?.uid === item.uid && !heistResult && (
            <div className="mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-xs">⚔ Challenge for <span className="text-amber-400">{item.name}</span></p>
                <span className="text-zinc-600 text-[10px]">Entry: {HEIST_COST} ⚡</span>
              </div>
              <p className="text-zinc-500 text-[11px]">Pick a crafted item from your inventory as your weapon. The one with the highest tier score wins.</p>

              {weaponChoices.length === 0 ? (
                <p className="text-zinc-600 text-xs italic">Craft some non-genesis items first to use as weapons.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {weaponChoices.slice(0, 8).map((w) => (
                    <button
                      key={w.uid}
                      onClick={() => setSelectedWeapon(selectedWeapon?.uid === w.uid ? null : w)}
                      className={`rounded-lg border p-2 flex items-center gap-2 text-left transition-colors ${selectedWeapon?.uid === w.uid ? 'bg-amber-900/30 border-amber-500/50' : 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-700/60'}`}
                    >
                      <span className="text-base leading-none">{renderEmojis(w.emojis)}</span>
                      <div className="min-w-0">
                        <p className="text-white text-[11px] font-semibold truncate">{w.name}</p>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${tierBadge[w.tier]}`}>{w.tier}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={resetHeist} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-semibold hover:bg-zinc-800">Cancel</button>
                <button
                  onClick={() => void startHeist()}
                  disabled={!selectedWeapon || heistLoading || craftz < HEIST_COST}
                  className="flex-1 py-2 rounded-lg bg-red-700 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {heistLoading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Dueling…
                    </span>
                  ) : craftz < HEIST_COST ? `Need ${HEIST_COST} ⚡` : '⚔ Launch Heist'}
                </button>
              </div>
            </div>
          )}

          {heistTarget?.uid === item.uid && heistResult && (
            <div className="mt-1.5 rounded-xl border p-4 space-y-2 text-center bg-zinc-900 border-zinc-700">
              <p className="text-2xl">{heistResult.heist.winnerFid === heistResult.heist.challengerFid ? '🏆' : '💀'}</p>
              <p className={`font-bold text-base ${heistResult.heist.winnerFid === heistResult.heist.challengerFid ? 'text-emerald-400' : 'text-red-400'}`}>
                {heistResult.heist.winnerFid === heistResult.heist.challengerFid ? 'You Win!' : 'You Lost'}
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
              <button onClick={resetHeist} className="mt-1 w-full py-2 rounded-lg bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700">
                Done
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
