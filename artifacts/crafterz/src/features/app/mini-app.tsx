'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  postGmEvent, postMintEvent,
  initiateHeist as apiInitiateHeist,
  fetchCaptions, reactToCaption, reportCaption,
} from './runtime-api';
import type { AppInventoryItem, AppTab } from './app-types';
import type { ServerCaption, ServerHeist } from './runtime-api';
import { useFeed } from './hooks/use-feed';
import { TIER_BADGE, EVM_CHAINS, CRAFTZ_COST, CRAFTZ_MAX, PTS } from './constants';
import { starColor, getAvatarUrl, generateTxHash } from './helpers';
import { useCraftz } from './hooks/use-craftz';
import { useServerSync } from './hooks/use-server-sync';
import { useTasks } from './hooks/use-tasks';
import { useMinting } from './hooks/use-minting';
import { useProfile } from './hooks/use-profile';
import { usePointToasts } from './hooks/use-point-toasts';
import { useCrafting } from './hooks/use-crafting';
import { useWeather } from './hooks/use-weather';
import { useAgents } from './hooks/use-agents';
import { AppHeader, CraftingCanvas, CraftzBar } from './mini-app-components';
import { InventoryTab, MegaMindsTab, TasksTab, LeaderboardTab, FeedTab, AdminTab, AgentsTab, SettingsModal } from './tabs';

export function MiniApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [gmChain, setGmChain] = useState(EVM_CHAINS[0].id);
  const [gmSending, setGmSending] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [captions, setCaptions] = useState<ServerCaption[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { profile, updateUsername, updatePfp, clearPfp, disconnectWallet } = useProfile();
  const avatarSrc = profile.pfpDataUrl ?? profile.pfpUrl ?? getAvatarUrl(profile.username);

  const { craftz, craftzRef, setCraftz } = useCraftz();
  const { currentEvent: weatherEvent } = useWeather();
  const agentsState = useAgents();
  const { events: feedEvents, loading: feedLoading } = useFeed(activeTab === 'feed');

  const {
    myPoints, setMyPoints,
    myMegaMinds, setMyMegaMinds,
    myCrafts, setMyCrafts,
    syncColor, syncLabel,
    recentDiscoveries,
    leaderboardData, myRank,
    syncFromServerPlayer,
    refreshServerSnapshot,
  } = useServerSync();

  const { pointToasts, awardPoints } = usePointToasts(setMyPoints);

  const {
    dailyTasks, tasksCompleted, tasksTotal, tasksPendingClaim,
    gmSent, advanceTask, claimTask,
  } = useTasks();

  const {
    mintModal, setMintModal, mintModalRef,
    mintingPaused, setMintingPaused,
    showMintPriceInput, mintPriceDraft,
    openMintPriceInput, changeMintPriceDraft,
    cancelMintPriceInput, toggleMintingPause,
  } = useMinting(0.01);

  const onMegaMindFound = useCallback((uid: string, name: string, emoji: string, tier: string) => {
    setMintModal({ uid, name, emoji, tier, phase: 'prompt' });
  }, [setMintModal]);

  const {
    inventory, setInventory,
    canvasItems, combining, pulseTarget, aiEnabled,
    canvasRef, addToCanvas, clearCanvas, handlePointerDown,
  } = useCrafting({
    craftzRef, setCraftz, mintingPaused,
    username: profile.username,
    onMegaMindFound,
    onAwardPoints: awardPoints,
    onAdvanceTask: advanceTask,
    onSetMyCrafts: setMyCrafts,
    onSetMyMegaMinds: setMyMegaMinds,
    onSyncFromServerPlayer: syncFromServerPlayer,
    onRefreshServerSnapshot: refreshServerSnapshot,
  });

  // ─── Comedy feed: fetch when feed tab opens ────────────────────────────────
  useEffect(() => {
    if (activeTab === 'feed') {
      void fetchCaptions(20).then(setCaptions);
    }
  }, [activeTab]);

  // ─── Admin feedback auto-clear ──────────────────────────────────────────────
  useEffect(() => {
    if (!adminFeedback) return;
    const t = setTimeout(() => setAdminFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [adminFeedback]);

  const adminAction = useCallback((msg: string) => setAdminFeedback(msg), []);

  // ─── GM ─────────────────────────────────────────────────────────────────────
  function sendGm() {
    if (gmSent || gmSending) return;
    setGmSending(true);
    setTimeout(() => {
      setGmSending(false);
      awardPoints(PTS.GM_ONCHAIN, '🌅 GM! +10 pts', '#a855f7');
      advanceTask('gm_onchain');
      void postGmEvent({ fid: profile.fid ?? 0, username: profile.username, chain: gmChain }).then((player) => syncFromServerPlayer(player));
    }, 1800);
  }

  // ─── Minting ─────────────────────────────────────────────────────────────────
  function advanceMint() {
    const modal = mintModalRef.current;
    if (!modal) return;
    if (modal.phase === 'prompt') {
      setMintModal((m) => m ? { ...m, phase: 'signing' } : null);
      // Simulate wallet signing (~1.5s)
      setTimeout(() => {
        setMintModal((m) => m ? { ...m, phase: 'confirming' } : null);
        // Simulate 3 on-chain confirmations (~3.5s)
        setTimeout(() => {
          const current = mintModalRef.current;
          if (!current) return;
          const tokenId = Math.floor(Math.random() * 9000) + 100;
          const txHash = generateTxHash();
          setMintModal((m) => m ? { ...m, phase: 'done', txHash } : null);
          setInventory((inv) => inv.map((i) => i.uid === current.uid ? { ...i, isMinted: true, tokenId, txHash } : i));
          awardPoints(PTS.MINT_MEGAMIND, '🎨 Minted! +25 pts', '#22c55e');
          advanceTask('mint_megamind');
          void postMintEvent({ fid: profile.fid ?? 0, username: profile.username, itemName: current.name, tokenId, txHash }).then((player) => {
            syncFromServerPlayer(player);
            void refreshServerSnapshot();
          });
        }, 3500);
      }, 1500);
    } else if (modal.phase === 'done') {
      setMintModal(null);
    }
  }

  function startMint(item: AppInventoryItem) {
    if (mintingPaused) { adminAction('Minting is currently paused'); return; }
    setMintModal({ uid: item.uid, name: item.name, emoji: item.emoji, tier: item.tier, phase: 'prompt' });
  }

  // ─── Task claiming ─────────────────────────────────────────────────────────
  function handleClaimTask(taskId: string) {
    claimTask(taskId, (task) => {
      awardPoints(task.points, `Task: ${task.title}`, '#22c55e');
      setCraftz((c) => { const next = Math.min(CRAFTZ_MAX, c + task.craftzReward); craftzRef.current = next; return next; });
    });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  function handleToggleMintingPause() {
    toggleMintingPause();
    adminAction(mintingPaused ? 'Minting resumed' : 'Minting paused');
  }

  function handleApplyMintPrice() {
    const newPrice = parseFloat(mintPriceDraft);
    if (!isNaN(newPrice) && newPrice > 0) {
      adminAction(`Mint price set to ${newPrice} CRAFTZ`);
      cancelMintPriceInput();
    }
  }

  // ─── Heist ─────────────────────────────────────────────────────────────────
  const HEIST_COST = 50;

  const handleInitiateHeist = useCallback(async (
    target: AppInventoryItem,
    weapon: AppInventoryItem,
  ): Promise<{ heist: ServerHeist; pointsAwarded: number } | null> => {
    if (craftzRef.current < HEIST_COST) return null;
    // Deduct entry fee autonomously (no wallet confirmation — in-game Craftz)
    setCraftz((c) => { const next = Math.max(0, c - HEIST_COST); craftzRef.current = next; return next; });

    const result = await apiInitiateHeist({
      challengerFid: 0,
      defenderFid: null,
      defenderUsername: 'Bot Opponent',
      targetItemName: target.name,
      targetItemEmojis: [target.emoji],
      targetItemTier: target.tier,
      entryCraftz: HEIST_COST,
      challengerItemName: weapon.name,
      challengerItemTier: weapon.tier,
      challengerItemGeneration: weapon.generation,
      paymentMethod: 'craftz',
    });

    if (!result) {
      // Network failure — refund entry fee
      setCraftz((c) => { const next = Math.min(CRAFTZ_MAX, c + HEIST_COST); craftzRef.current = next; return next; });
      return null;
    }

    if (result.pointsAwarded > 0) {
      awardPoints(result.pointsAwarded, `⚔ Heist Win! +${result.pointsAwarded} pts`, '#ef4444');
    }

    return result;
  }, [craftzRef, setCraftz, awardPoints]);

  // ─── Agent rental ───────────────────────────────────────────────────────────
  const handleRentAgent = useCallback(async (agentId: string, costCraftz: number) => {
    if (craftzRef.current < costCraftz) return;
    // Deduct via in-game Craftz (x402 autonomous payment — no wallet popup)
    setCraftz((c) => { const next = Math.max(0, c - costCraftz); craftzRef.current = next; return next; });

    const result = await agentsState.rentAgent(agentId, 0, 'craftz');
    if (!result.ok) {
      // Refund if server rejected
      setCraftz((c) => { const next = Math.min(CRAFTZ_MAX, c + costCraftz); craftzRef.current = next; return next; });
    } else if (result.buffApplied) {
      awardPoints(0, `🧠 ${result.buffApplied}`, '#8b5cf6');
    }
  }, [craftzRef, setCraftz, agentsState, awardPoints]);

  // ─── Comedy feed reactions ──────────────────────────────────────────────────
  const handleReactCaption = useCallback((id: string) => {
    setCaptions((prev) => prev.map((c) => c.id === id ? { ...c, hahCount: c.hahCount + 1 } : c));
    void reactToCaption(id);
  }, []);

  const handleReportCaption = useCallback((id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
    void reportCaption(id);
  }, []);

  // ─── Derived state ──────────────────────────────────────────────────────────
  const megaMindItems = inventory.filter((i) => i.isMegaMind);
  const filteredInventory = inventory.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const craftzColor = craftz > 49 ? '#22c55e' : craftz > 19 ? '#eab308' : '#ef4444';
  const craftzLow = craftz < CRAFTZ_COST;

  const tabs: Array<{ id: AppTab; label: string; badge: string | number | null; badgeAlert: boolean }> = [
    { id: 'inventory',   label: '📚 Items',   badge: inventory.length,                       badgeAlert: false },
    { id: 'megaminds',   label: '💎 Mega',    badge: megaMindItems.length,                   badgeAlert: false },
    { id: 'tasks',       label: '✅ Tasks',   badge: `${tasksCompleted}/${tasksTotal}`,       badgeAlert: tasksPendingClaim > 0 },
    { id: 'feed',        label: '📡 Feed',    badge: null,                                   badgeAlert: false },
    { id: 'agents',      label: '🧠 Agents',  badge: agentsState.agents.filter((a) => a.isRentedByMe).length || null, badgeAlert: false },
  ];

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-zinc-950 text-white" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      <PointToastLayer toasts={pointToasts} />

      {mintModal && (
        <MintModal
          mintModal={mintModal}
          onClose={() => setMintModal(null)}
          onAdvance={advanceMint}
          tierBadge={TIER_BADGE}
        />
      )}

      {adminFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 shadow-xl">
          <p className="text-white text-sm font-semibold">{adminFeedback}</p>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          profile={profile}
          onUpdateUsername={updateUsername}
          onUpdatePfp={updatePfp}
          onClearPfp={clearPfp}
          onDisconnectWallet={disconnectWallet}
          craftz={craftz}
          craftzMax={CRAFTZ_MAX}
          aiEnabled={aiEnabled}
          weatherEvent={weatherEvent}
          activeAgentCount={agentsState.agents.filter((a) => a.isRentedByMe).length}
          myPoints={myPoints}
          myRank={typeof myRank === 'number' ? myRank : 99}
        />
      )}

      <AppHeader
        syncColor={syncColor}
        syncLabel={syncLabel}
        isAdmin={false}
        myRank={typeof myRank === 'number' ? myRank : 99}
        myPoints={myPoints}
        avatarSrc={avatarSrc}
        weatherEvent={weatherEvent}
        onAvatarClick={() => setSettingsOpen(true)}
      />

      <CraftingCanvas
        canvasRef={canvasRef}
        canvasItems={canvasItems}
        craftzLow={craftzLow}
        onClearCanvas={clearCanvas}
        onPointerDown={handlePointerDown}
        combining={combining}
        pulseTarget={pulseTarget}
        starColor={starColor}
      />

      <CraftzBar
        craftz={craftz}
        craftzMax={CRAFTZ_MAX}
        craftzCost={CRAFTZ_COST}
        craftzColor={craftzColor}
        craftzLow={craftzLow}
      />

      <TabBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

      <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
        {activeTab === 'inventory' && (
          <InventoryTab searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} filteredInventory={filteredInventory} onAddToCanvas={addToCanvas} />
        )}
        {activeTab === 'megaminds' && (
          <MegaMindsTab
            megaMindItems={megaMindItems}
            inventory={inventory}
            tierBadge={TIER_BADGE}
            craftz={craftz}
            onStartMint={startMint}
            onInitiateHeist={handleInitiateHeist}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab dailyTasks={dailyTasks} tasksCompleted={tasksCompleted} tasksTotal={tasksTotal} gmChain={gmChain} evmChains={EVM_CHAINS} gmSent={gmSent} gmSending={gmSending} onSelectGmChain={setGmChain} onSendGm={sendGm} onClaimTask={handleClaimTask} />
        )}
        {activeTab === 'feed' && (
          <FeedTab
            feedEvents={feedEvents}
            feedLoading={feedLoading}
            captions={captions}
            leaderboardData={leaderboardData}
            myRank={typeof myRank === 'number' ? myRank : 99}
            tierBadge={TIER_BADGE}
            onReactCaption={handleReactCaption}
            onReportCaption={handleReportCaption}
          />
        )}
        {activeTab === 'agents' && (
          <AgentsTab
            agents={agentsState.agents}
            loading={agentsState.loading}
            renting={agentsState.renting}
            craftz={craftz}
            onMount={() => void agentsState.fetchAgents(0)}
            onRent={handleRentAgent}
          />
        )}
        {activeTab === 'admin' && (
          <AdminTab
            adminFid={0}
            adminStats={{ totalWords: 0, totalPlayers: 0, totalCrafts: 0, megaMindsDiscovered: 0, megaMindsMinted: 0, craftzCirculating: 0, contractBalance: '0' }}
            mintingPaused={mintingPaused}
            showMintPriceInput={showMintPriceInput}
            mintPrice={CRAFTZ_COST}
            mintPriceDraft={mintPriceDraft}
            onToggleMintingPause={handleToggleMintingPause}
            onOpenMintPriceInput={openMintPriceInput}
            onChangeMintPriceDraft={changeMintPriceDraft}
            onApplyMintPrice={handleApplyMintPrice}
            onCancelMintPriceInput={cancelMintPriceInput}
            onAdminAction={adminAction}
          />
        )}
      </div>
    </div>
  );
}

function PointToastLayer({ toasts }: { toasts: Array<{ id: string; message: string; pts: number; color: string }> }) {
  return (
    <div className="fixed top-14 right-3 z-50 flex flex-col gap-1 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl animate-bounce-in text-xs font-bold" style={{ color: t.color }}>
          +{t.pts} <span className="text-zinc-300 font-normal">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function TabBar({
  tabs, activeTab, onSelect,
}: {
  tabs: Array<{ id: AppTab; label: string; badge: string | number | null; badgeAlert: boolean }>;
  activeTab: AppTab;
  onSelect: (tab: AppTab) => void;
}) {
  return (
    <div className="flex border-b border-zinc-800 bg-zinc-900 flex-shrink-0 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex-1 min-w-[60px] py-2 text-[10px] font-semibold transition-colors flex flex-col items-center justify-center gap-0.5 relative ${activeTab === tab.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {tab.badgeAlert && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
          <span>{tab.label}</span>
          {tab.badge !== null && <span className="text-zinc-600 text-[9px]">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function MintModal({
  mintModal, onClose, onAdvance, tierBadge,
}: {
  mintModal: { uid: string; name: string; emoji: string; tier: string; phase: string; txHash?: string };
  onClose: () => void;
  onAdvance: () => void;
  tierBadge: Record<string, string>;
}) {
  const [confirmCount, setConfirmCount] = useState(0);

  useEffect(() => {
    if (mintModal.phase !== 'confirming') { setConfirmCount(0); return; }
    const timers = [900, 1900, 3100].map((delay, i) =>
      setTimeout(() => setConfirmCount(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [mintModal.phase]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm px-4 pb-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
        {mintModal.phase === 'prompt' && (
          <>
            <p className="text-amber-400 font-bold text-xs tracking-[0.15em] uppercase mb-3">🎉 MegaMind Discovery!</p>
            <div className="text-6xl my-4">{mintModal.emoji}</div>
            <p className="text-white font-bold text-xl">{mintModal.name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierBadge[mintModal.tier]}`}>{mintModal.tier}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">⚡ MEGAMIND</span>
            </div>
            <p className="text-zinc-600 text-xs mt-1 mb-4">First ever creation of this item globally</p>
            <div className="bg-zinc-800/60 rounded-xl p-4 text-left mb-5 space-y-2">
              <p className="text-sm text-zinc-300">✓ <span className="text-white">+15 bonus points</span></p>
              <p className="text-sm text-zinc-300">✓ <span className="text-white">Permanently on-chain</span></p>
              <p className="text-sm text-zinc-300">✓ <span className="text-white">Proof you discovered it first</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 transition-colors">Skip</button>
              <button onClick={onAdvance} className="flex-1 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 transition-colors">🎨 Mint NFT</button>
            </div>
            <p className="text-zinc-700 text-[10px] mt-3">Requires wallet confirmation to proceed</p>
          </>
        )}

        {mintModal.phase === 'signing' && (
          <div className="py-8">
            <div className="text-5xl mb-4 animate-pulse">👛</div>
            <p className="text-white font-semibold text-base">Sign in wallet</p>
            <p className="text-zinc-500 text-xs mt-2">Preparing your transaction…</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-zinc-500 text-xs">Waiting for signature</span>
            </div>
          </div>
        )}

        {mintModal.phase === 'confirming' && (
          <div className="py-8">
            <div className="text-5xl mb-4">{mintModal.emoji}</div>
            <p className="text-white font-semibold text-base">Confirming on-chain</p>
            <p className="text-zinc-500 text-xs mt-1 mb-4">Transaction submitted to Base</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`flex flex-col items-center gap-1 transition-all duration-500 ${confirmCount >= n ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${confirmCount >= n ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' : 'border-zinc-700 text-zinc-600'}`}>
                    {confirmCount >= n ? '✓' : n}
                  </div>
                  <span className="text-[9px] text-zinc-600">Block {n}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-[10px]">{confirmCount}/3 confirmations</p>
          </div>
        )}

        {mintModal.phase === 'done' && (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-emerald-400 font-bold text-lg mb-1">Minted!</p>
            <p className="text-white font-semibold">{mintModal.name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierBadge[mintModal.tier]}`}>{mintModal.tier}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">✓ NFT</span>
            </div>
            <p className="text-zinc-500 text-xs mb-3">Your discovery is permanently on-chain. +25 pts awarded.</p>
            {mintModal.txHash && (
              <div className="bg-zinc-800/60 rounded-xl p-3 mb-4">
                <p className="text-zinc-600 text-[10px] mb-1.5">Transaction Hash</p>
                <a
                  href={`https://basescan.org/tx/${mintModal.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-[10px] font-mono hover:text-blue-300 break-all underline underline-offset-2"
                >
                  {mintModal.txHash.slice(0, 14)}…{mintModal.txHash.slice(-8)} ↗
                </a>
                <p className="text-zinc-700 text-[9px] mt-1.5">View on Basescan</p>
              </div>
            )}
            <button onClick={onAdvance} className="w-full py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors">Done</button>
          </>
        )}
      </div>
    </div>
  );
}
