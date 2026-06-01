import type { DiscoveryFeedItem } from '../discovery-feed';
import type { EmojiRenderer, PointsConfig } from '../app-types';
import type { LeaderboardRow } from '../hooks/use-server-sync';

export function LeaderboardTab({
  myRank,
  leaderboardData,
  recentDiscoveries,
  renderEmojis,
  tierBadge,
  points,
}: {
  myRank: number | string;
  leaderboardData: LeaderboardRow[];
  recentDiscoveries: DiscoveryFeedItem[];
  renderEmojis: EmojiRenderer;
  tierBadge: Record<string, string>;
  points: PointsConfig;
}) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-zinc-600 text-xs">Global rankings · live</p>
        <p className="text-amber-400 text-xs font-bold">Your rank: #{myRank}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">How Points Work</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <p className="text-zinc-400 text-xs">⚗️ Common craft <span className="text-white font-semibold ml-1">+{points.CRAFT_COMMON} pts</span></p>
          <p className="text-zinc-400 text-xs">💫 Rare craft <span className="text-white font-semibold ml-1">+{points.CRAFT_RARE} pts</span></p>
          <p className="text-zinc-400 text-xs">👑 Legendary <span className="text-white font-semibold ml-1">+{points.CRAFT_LEGENDARY} pts</span></p>
          <p className="text-zinc-400 text-xs">⚡ MegaMind bonus <span className="text-white font-semibold ml-1">+{points.MEGAMIND_BONUS} pts</span></p>
          <p className="text-zinc-400 text-xs">🎨 Mint NFT <span className="text-white font-semibold ml-1">+{points.MINT_MEGAMIND} pts</span></p>
          <p className="text-zinc-400 text-xs">🌅 GM on-chain <span className="text-white font-semibold ml-1">+{points.GM_ONCHAIN} pts</span></p>
        </div>
      </div>

      {leaderboardData.map((player, index) => (
        <div
          key={player.username}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${player.isCurrentUser ? 'bg-amber-950/25 border border-amber-500/25' : index < 3 ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-900/40'}`}
        >
          <span className={`text-sm font-bold w-7 text-center flex-shrink-0 ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-zinc-300' : player.rank === 3 ? 'text-amber-600' : 'text-zinc-600'}`}>
            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
          </span>
          <img src={player.pfp} className="w-8 h-8 rounded-full border border-zinc-800 flex-shrink-0" alt="" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${player.isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
              {player.username}{player.isCurrentUser && ' (you)'}
            </p>
            <p className="text-zinc-600 text-xs">{player.megaMinds} MegaMinds · {player.crafts} crafts</p>
          </div>
          <span className="text-amber-400 font-bold text-sm flex-shrink-0">{player.points.toLocaleString()}</span>
        </div>
      ))}

      <div className="mt-4">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2 px-1">Recent MegaMind Discoveries</p>
        <div className="space-y-1.5">
          {recentDiscoveries.map((d, index) => (
            <div key={`${d.discoverer}-${d.name}-${d.time}-${index}`} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
              <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${d.discoverer}`} className="w-7 h-7 rounded-full border border-zinc-700 flex-shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-[10px] font-medium truncate">
                  <span className="text-white font-semibold">{d.discoverer}</span> discovered
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base leading-none">{renderEmojis(d.emojis)}</span>
                  <p className="text-white text-xs font-bold truncate">{d.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tierBadge[d.tier]}`}>{d.tier}</span>
                  {d.minted && <span className="text-emerald-400 text-[9px] font-bold flex-shrink-0">✓ NFT</span>}
                </div>
              </div>
              <p className="text-zinc-600 text-[10px] flex-shrink-0">{d.time}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pb-4" />
    </div>
  );
}
