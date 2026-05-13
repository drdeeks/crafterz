import { memo } from 'react';
import type { DiscoveryFeedItem } from './discovery-feed';
import type {
  AdminStats,
  AppDailyTask,
  AppInventoryItem,
  EmojiRenderer,
  EvmChainOption,
  LeaderboardRow,
  PointsConfig,
} from './app-types';
import { AdminAction, StatCard, TaskProgressBar } from './ui-primitives';

export const InventoryTab = memo(function InventoryTab({
  searchQuery,
  onSearchQueryChange,
  filteredInventory,
  onAddToCanvas,
  renderEmojis,
  tierBadge,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredInventory: AppInventoryItem[];
  onAddToCanvas: (item: AppInventoryItem) => void;
  renderEmojis: EmojiRenderer;
  tierBadge: Record<string, string>;
}) {
  return (
    <div className="p-3">
      <div className="mb-3 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
          🔍
        </span>
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {filteredInventory.map((item) => (
          <button
            key={item.uid}
            onClick={() => onAddToCanvas(item)}
            className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition-all active:scale-90 ${item.isMegaMind && !item.isMinted ? 'bg-amber-950/25 border-amber-500/35 hover:border-amber-400' : item.isMinted ? 'bg-emerald-950/15 border-emerald-600/30' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
          >
            {item.isMegaMind && !item.isMinted && (
              <span className="text-amber-400 text-[9px] font-bold leading-none">
                ⚡ MEGA
              </span>
            )}
            {item.isMinted && (
              <span className="text-emerald-400 text-[9px] font-bold leading-none">
                ✓ MINTED
              </span>
            )}
            <span className="text-2xl leading-none">{renderEmojis(item.emojis)}</span>
            <span className="text-white text-[11px] font-semibold text-center leading-tight">
              {item.name}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tierBadge[item.tier]}`}>
              {item.tier}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

export const MegaMindsTab = memo(function MegaMindsTab({
  megaMindItems,
  renderEmojis,
  tierBadge,
  onStartMint,
}: {
  megaMindItems: AppInventoryItem[];
  renderEmojis: EmojiRenderer;
  tierBadge: Record<string, string>;
  onStartMint: (item: AppInventoryItem) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      {megaMindItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl opacity-30">⚡</span>
          <p className="text-zinc-500 text-sm">No MegaMinds yet</p>
          <p className="text-zinc-700 text-xs text-center leading-relaxed">
            Craft an item no one on the platform
            <br />
            has ever created — that's a MegaMind.
          </p>
        </div>
      ) : (
        megaMindItems.map((item) => (
          <div
            key={item.uid}
            className={`rounded-xl border p-4 flex items-center gap-4 ${item.isMinted ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-amber-950/15 border-amber-500/25'}`}
          >
            <div className="relative flex-shrink-0">
              <span className="text-4xl">{renderEmojis(item.emojis)}</span>
              {item.isMinted && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tierBadge[item.tier]}`}>
                  {item.tier}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  ⚡ MEGAMIND
                </span>
              </div>
              {item.isMinted && item.tokenId && (
                <p className="text-zinc-600 text-xs mt-1">Token #{item.tokenId}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {item.isMinted ? (
                <div>
                  <p className="text-amber-400 font-bold text-sm">25 pts</p>
                  <button className="text-emerald-400 text-xs mt-1 hover:text-emerald-300">
                    View →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-amber-400 font-bold text-sm">10 pts</p>
                  <button
                    onClick={() => onStartMint(item)}
                    className="bg-amber-400 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors"
                  >
                    🎨 Mint
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

export const TasksTab = memo(function TasksTab({
  dailyTasks,
  tasksCompleted,
  tasksTotal,
  gmChain,
  evmChains,
  gmSent,
  gmSending,
  onSelectGmChain,
  onSendGm,
  onClaimTask,
  renderEmojis,
}: {
  dailyTasks: AppDailyTask[];
  tasksCompleted: number;
  tasksTotal: number;
  gmChain: string;
  evmChains: EvmChainOption[];
  gmSent: boolean;
  gmSending: boolean;
  onSelectGmChain: (chainId: string) => void;
  onSendGm: () => void;
  onClaimTask: (taskId: string) => void;
  renderEmojis: EmojiRenderer;
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-bold text-sm">Daily Tasks</p>
            <p className="text-zinc-600 text-xs mt-0.5">Resets at midnight UTC</p>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-sm">
              {tasksCompleted}/{tasksTotal}
            </p>
            <p className="text-zinc-600 text-xs">completed</p>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(tasksCompleted / tasksTotal) * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #22c55e)',
            }}
          />
        </div>
        {tasksCompleted === tasksTotal && (
          <p className="text-emerald-400 text-xs font-semibold text-center mt-2">
            🎉 All tasks complete! Come back tomorrow.
          </p>
        )}
      </div>

      {dailyTasks.filter((task) => task.type === 'gm_onchain').map((task) => (
        <div
          key={task.id}
          className={`rounded-xl border p-4 ${task.completed ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-bold text-sm">{task.title}</p>
                <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
                <span className="text-blue-400 text-xs">+{task.craftzReward} Craftz</span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{task.description}</p>

              {!task.completed && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {evmChains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => onSelectGmChain(chain.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${gmChain === chain.id ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        {chain.icon} {chain.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onSendGm}
                    disabled={gmSent || gmSending}
                    className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${gmSent ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 cursor-default' : gmSending ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
                  >
                    {gmSent ? (
                      '✓ GM Sent!'
                    ) : gmSending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-zinc-500 border-t-violet-400 rounded-full animate-spin inline-block" />
                        Broadcasting on {evmChains.find((chain) => chain.id === gmChain)?.name}…
                      </span>
                    ) : (
                      `🌅 Send GM on ${evmChains.find((chain) => chain.id === gmChain)?.name}`
                    )}
                  </button>
                </div>
              )}

              {task.completed && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-emerald-400 text-xs font-semibold">✓ Completed</span>
                  <span className="text-zinc-600 text-xs">· Claimed {task.points} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {dailyTasks.filter((task) => task.type === 'craft_target').map((task) => {
        const revealed = task.progress >= task.required || task.completed;
        return (
          <div
            key={task.id}
            className={`rounded-xl border p-4 ${task.completed ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{task.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold text-sm">{task.title}</p>
                  <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
                  <span className="text-blue-400 text-xs">+{task.craftzReward} Craftz</span>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">{task.description}</p>

                <div
                  className={`mt-3 rounded-xl border p-3 flex items-center gap-3 ${revealed ? 'bg-amber-950/20 border-amber-500/30' : 'bg-zinc-800/60 border-zinc-700'}`}
                >
                  <div className="text-3xl w-10 text-center">
                    {revealed ? renderEmojis(task.targetEmojis ?? ['❓']) : '❓'}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${revealed ? 'text-amber-300' : 'text-zinc-400'}`}>
                      {revealed ? task.targetItem : '??? Mystery Item'}
                    </p>
                    <p className="text-zinc-600 text-xs mt-0.5">💡 {task.targetHint}</p>
                  </div>
                </div>

                {!task.completed && task.progress < task.required && (
                  <p className="text-zinc-600 text-[10px] mt-2">
                    Head to the canvas and experiment — the hint should point you in the right direction.
                  </p>
                )}

                {!task.completed && task.progress >= task.required && (
                  <button
                    onClick={() => onClaimTask(task.id)}
                    className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                  >
                    🎉 Claim Reward
                  </button>
                )}
                {task.completed && (
                  <p className="text-emerald-400 text-xs font-semibold mt-2">
                    ✓ Completed · +{task.points} pts claimed
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {dailyTasks
        .filter((task) => task.type !== 'gm_onchain' && task.type !== 'craft_target')
        .map((task) => {
          const isDone = task.completed;
          const isReady = !isDone && task.progress >= task.required;
          const pct = Math.min(100, Math.round((task.progress / task.required) * 100));
          return (
            <div
              key={task.id}
              className={`rounded-xl border p-4 ${isDone ? 'bg-emerald-950/10 border-emerald-600/25' : isReady ? 'bg-amber-950/15 border-amber-500/35' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
                      <span className="text-blue-400 text-xs">+{task.craftzReward}⚡</span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{task.description}</p>

                  {task.required > 1 && !isDone && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-600">
                          {task.progress}/{task.required}
                        </span>
                        <span style={{ color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
                      </div>
                      <TaskProgressBar progress={task.progress} required={task.required} />
                    </div>
                  )}

                  {isDone && (
                    <p className="text-emerald-400 text-xs font-semibold mt-2">
                      ✓ Completed · +{task.points} pts claimed
                    </p>
                  )}
                  {isReady && (
                    <button
                      onClick={() => onClaimTask(task.id)}
                      className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                    >
                      🎉 Claim Reward
                    </button>
                  )}
                  {!isDone && !isReady && task.required === 1 && (
                    <p className="text-zinc-700 text-[10px] mt-1.5">
                      {task.type === 'discover_new'
                        ? 'Craft an item no one has ever created — your MegaMind will auto-detect on the canvas.'
                        : task.type === 'mint_megamind'
                          ? 'Mint any MegaMind from the 💎 Mega tab to complete this task.'
                          : task.type === 'craft_legendary'
                            ? 'Craft a Legendary-tier item on the canvas to complete this.'
                            : 'Complete this action on the canvas to unlock the reward.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      <div className="pb-4" />
    </div>
  );
});

export const LeaderboardTab = memo(function LeaderboardTab({
  myRank,
  leaderboardData,
  recentDiscoveries,
  renderEmojis,
  tierBadge,
  points,
}: {
  myRank: number;
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
          <p className="text-zinc-400 text-xs">
            ⚗️ Common craft <span className="text-white font-semibold ml-1">+{points.CRAFT_COMMON} pts</span>
          </p>
          <p className="text-zinc-400 text-xs">
            💫 Rare craft <span className="text-white font-semibold ml-1">+{points.CRAFT_RARE} pts</span>
          </p>
          <p className="text-zinc-400 text-xs">
            👑 Legendary <span className="text-white font-semibold ml-1">+{points.CRAFT_LEGENDARY} pts</span>
          </p>
          <p className="text-zinc-400 text-xs">
            ⚡ MegaMind bonus <span className="text-white font-semibold ml-1">+{points.MEGAMIND_BONUS} pts</span>
          </p>
          <p className="text-zinc-400 text-xs">
            🎨 Mint NFT <span className="text-white font-semibold ml-1">+{points.MINT_MEGAMIND} pts</span>
          </p>
          <p className="text-zinc-400 text-xs">
            🌅 GM on-chain <span className="text-white font-semibold ml-1">+{points.GM_ONCHAIN} pts</span>
          </p>
        </div>
      </div>

      {leaderboardData.map((player, index) => (
        <div
          key={player.username}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${player.isCurrentUser ? 'bg-amber-950/25 border border-amber-500/25' : index < 3 ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-900/40'}`}
        >
          <span
            className={`text-sm font-bold w-7 text-center flex-shrink-0 ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-zinc-300' : player.rank === 3 ? 'text-amber-600' : 'text-zinc-600'}`}
          >
            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
          </span>
          <img src={player.pfp} className="w-8 h-8 rounded-full border border-zinc-800 flex-shrink-0" alt="" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${player.isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
              {player.username}
              {player.isCurrentUser && ' (you)'}
            </p>
            <p className="text-zinc-600 text-xs">
              {player.megaMinds} MegaMinds · {player.crafts} crafts
            </p>
          </div>
          <span className="text-amber-400 font-bold text-sm flex-shrink-0">
            {player.points.toLocaleString()}
          </span>
        </div>
      ))}

      <div className="mt-4">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2 px-1">
          Recent MegaMind Discoveries
        </p>
        <div className="space-y-1.5">
          {recentDiscoveries.map((discovery, index) => (
            <div key={index} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
              <img
                src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${discovery.discoverer}`}
                className="w-7 h-7 rounded-full border border-zinc-700 flex-shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-[10px] font-medium truncate">
                  <span className="text-white font-semibold">{discovery.discoverer}</span> discovered
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base leading-none">{renderEmojis(discovery.emojis)}</span>
                  <p className="text-white text-xs font-bold truncate">{discovery.name}</p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${tierBadge[discovery.tier]}`}
                  >
                    {discovery.tier}
                  </span>
                  {discovery.minted && (
                    <span className="text-emerald-400 text-[9px] font-bold flex-shrink-0">✓ NFT</span>
                  )}
                </div>
              </div>
              <p className="text-zinc-600 text-[10px] flex-shrink-0">{discovery.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
});

export const AdminTab = memo(function AdminTab({
  adminFid,
  adminStats,
  mintingPaused,
  showMintPriceInput,
  mintPrice,
  mintPriceDraft,
  onToggleMintingPause,
  onOpenMintPriceInput,
  onChangeMintPriceDraft,
  onApplyMintPrice,
  onCancelMintPriceInput,
  onAdminAction,
}: {
  adminFid: number;
  adminStats: AdminStats;
  mintingPaused: boolean;
  showMintPriceInput: boolean;
  mintPrice: number;
  mintPriceDraft: string;
  onToggleMintingPause: () => void;
  onOpenMintPriceInput: () => void;
  onChangeMintPriceDraft: (value: string) => void;
  onApplyMintPrice: () => void;
  onCancelMintPriceInput: () => void;
  onAdminAction: (message: string) => void;
}) {
  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center gap-2 py-1">
        <span className="text-red-400 text-base">⚙️</span>
        <div>
          <p className="text-white font-bold text-sm">Admin Dashboard</p>
          <p className="text-zinc-600 text-xs">FID {adminFid} · Owner access</p>
        </div>
        {mintingPaused && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            MINTING PAUSED
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Words" value={adminStats.totalWords} sub="+124 today" />
        <StatCard label="Active Players" value={adminStats.totalPlayers} sub="+341 this week" />
        <StatCard label="Total Crafts" value={adminStats.totalCrafts} sub="+8,293 today" />
        <StatCard label="MegaMinds" value={adminStats.megaMindsDiscovered} sub={`${adminStats.megaMindsMinted} minted`} />
        <StatCard label="Craftz Supply" value={adminStats.craftzCirculating.toLocaleString()} sub="in circulation" />
        <StatCard label="Contract Balance" value={adminStats.contractBalance} sub="on-chain" />
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Minting Controls</p>
        <div className="space-y-2">
          <AdminAction
            icon={mintingPaused ? '▶️' : '⏸️'}
            label={mintingPaused ? 'Resume Minting' : 'Pause Minting'}
            desc={mintingPaused ? 'Allow users to mint MegaMind NFTs again' : 'Temporarily halt all new NFT minting'}
            variant={mintingPaused ? 'success' : 'danger'}
            onClick={onToggleMintingPause}
          />
          {!showMintPriceInput ? (
            <AdminAction
              icon="🔢"
              label={`Set Mint Price · ${mintPrice === 0 ? 'Free' : `${mintPrice} ETH`}`}
              desc="Adjust the fee for minting MegaMind NFTs — updates the contract"
              onClick={onOpenMintPriceInput}
            />
          ) : (
            <div className="bg-zinc-900 border border-amber-500/40 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-white">Set Mint Price (ETH)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={mintPriceDraft}
                  onChange={(event) => onChangeMintPriceDraft(event.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  placeholder="0.001"
                />
                <button
                  onClick={onApplyMintPrice}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 transition-colors"
                >
                  Set
                </button>
                <button
                  onClick={onCancelMintPriceInput}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-zinc-600 text-[10px]">Enter 0 for free mints. Calls setMintPrice() on the contract.</p>
            </div>
          )}
          <AdminAction
            icon="🚫"
            label="Revoke MegaMind"
            desc="Remove MegaMind status from a specific item"
            variant="danger"
            onClick={() => onAdminAction('Revoke MegaMind → opens item selector')}
          />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Airdrops & Tokens</p>
        <div className="space-y-2">
          <AdminAction
            icon="⚡"
            label="Airdrop Craftz"
            desc="Send in-game Craftz tokens to selected users or all players"
            onClick={() => onAdminAction('Airdrop Craftz → select recipients')}
          />
          <AdminAction
            icon="🪙"
            label="Airdrop ERC-20 Token"
            desc="Send any EVM token to a user list via CSV or FID range"
            onClick={() => onAdminAction('ERC-20 airdrop → token selector')}
          />
          <AdminAction
            icon="🎁"
            label="Airdrop NFT"
            desc="Send a specific MegaMind NFT token to target wallets"
            onClick={() => onAdminAction('NFT airdrop → token ID selector')}
          />
          <AdminAction
            icon="💰"
            label="Batch Transfer ETH"
            desc="Send ETH to multiple wallet addresses from contract"
            onClick={() => onAdminAction('Batch ETH transfer → address list')}
          />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Contract Actions</p>
        <div className="space-y-2">
          <AdminAction
            icon="📝"
            label="Call Contract Function"
            desc="Manually invoke any contract function with ABI params"
            onClick={() => onAdminAction('Contract caller → ABI function picker')}
          />
          <AdminAction
            icon="🔄"
            label="Update Contract Address"
            desc="Point the app to a new deployed contract address"
            onClick={() => onAdminAction('Update contract → address input')}
          />
          <AdminAction
            icon="📊"
            label="View On-Chain Events"
            desc="Tail live events: Minted, Transferred, Burned"
            onClick={() => onAdminAction('Event log → chain explorer')}
          />
          <AdminAction
            icon="🔑"
            label="Transfer Ownership"
            desc="Transfer contract ownership to a new wallet address"
            variant="danger"
            onClick={() => onAdminAction('Transfer ownership → requires wallet confirm')}
          />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Platform Controls</p>
        <div className="space-y-2">
          <AdminAction
            icon="🛑"
            label="Pause All Crafting"
            desc="Disable word combination for all users (maintenance)"
            variant="danger"
            onClick={() => onAdminAction('⚠️ All crafting paused')}
          />
          <AdminAction
            icon="🧹"
            label="Clear Word Registry"
            desc="Remove all dynamically generated items from global DB"
            variant="danger"
            onClick={() => onAdminAction('Clear registry → requires confirmation')}
          />
          <AdminAction
            icon="📢"
            label="Broadcast Notification"
            desc="Send a Farcaster frame notification to all users"
            onClick={() => onAdminAction('Notification composer → opens')}
          />
          <AdminAction
            icon="📈"
            label="Export Analytics CSV"
            desc="Download full craft history, user stats, mint records"
            onClick={() => onAdminAction('Exporting analytics…')}
          />
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
});
