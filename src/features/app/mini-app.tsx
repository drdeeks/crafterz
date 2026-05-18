'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  completeTask,
  fetchLeaderboardSnapshot,
  fetchTasks,
  postCraftEvent,
  postGmEvent,
  postMintEvent,
  progressTask,
  ServerPlayer,
  ServerTask,
} from './runtime-api';
import { craft, isGenesisItem, getGenesisItem } from './crafting-engine';
import { DiscoveryFeedItem, toDiscoveryFeed } from './discovery-feed';
import type {
  AppCanvasItem,
  AppDailyTask,
  AppDailyTaskType,
  AppInventoryItem,
  AppMintPhase,
  AppTab,
  EvmChainOption,
} from './app-types';
import {
  AdminTab,
  InventoryTab,
  LeaderboardTab,
  MegaMindsTab,
  TasksTab,
} from './mini-app-tabs';

// ─── Point values ────────────────────────────────────────────────────────────
const PTS = {
  CRAFT_COMMON:    2,
  CRAFT_RARE:      5,
  CRAFT_LEGENDARY: 15,
  MEGAMIND_BONUS:  15,
  MINT_MEGAMIND:   25,
  GM_ONCHAIN:      10,
  TASK_COMPLETE:   0,
} as const;

// ─── Supported EVM chains ────────────────────────────────────────────────────
const EVM_CHAINS: EvmChainOption[] = [
  { id: 'base',     name: 'Base',     icon: '🔵', color: '#0052FF' },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠',  color: '#627EEA' },
  { id: 'optimism', name: 'Optimism', icon: '🔴',  color: '#FF0420' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷',  color: '#28A0F0' },
  { id: 'polygon',  name: 'Polygon',  icon: '🟣',  color: '#8247E5' },
  { id: 'zora',     name: 'Zora',     icon: '⚡',  color: '#A855F7' },
];

// ─── Initial Inventory (7 Genesis elements) ──────────────────────────────────
const INITIAL_INVENTORY: AppInventoryItem[] = [
  { uid: 'u-water', id: 'water', name: 'Water', emojis: ['💧'],  tier: 'GENESIS' },
  { uid: 'u-fire',  id: 'fire',  name: 'Fire',  emojis: ['🔥'],  tier: 'GENESIS' },
  { uid: 'u-earth', id: 'earth', name: 'Earth', emojis: ['🌍'],  tier: 'GENESIS' },
  { uid: 'u-air',   id: 'air',   name: 'Air',   emojis: ['💨'],  tier: 'GENESIS' },
  { uid: 'u-sun',   id: 'sun',   name: 'Sun',   emojis: ['☀️'],  tier: 'GENESIS' },
  { uid: 'u-moon',  id: 'moon',  name: 'Moon',  emojis: ['🌙'],  tier: 'GENESIS' },
  { uid: 'u-time',  id: 'time',  name: 'Time',  emojis: ['⏰'],  tier: 'GENESIS' },
];

// ─── Daily Task Targets ──────────────────────────────────────────────────────
const TARGET_POOL: Array<{ name: string; hint: string; emojis: [string, string?] }> = [
  { name: 'Lava',        hint: 'Formed when earth meets fire',         emojis: ['🌋', '🔴'] },
  { name: 'Steam',       hint: 'What fire does to water',              emojis: ['💨', '🌫️'] },
  { name: 'Fossil',      hint: 'Earth preserves things over time',     emojis: ['🦴', '🪨'] },
  { name: 'Tide',        hint: 'The moon pulls the ocean',             emojis: ['🌊', '🌙'] },
  { name: 'Eclipse',     hint: 'Two celestial bodies aligned',         emojis: ['🌘', '☀️'] },
  { name: 'Plasma',      hint: 'Air superheated by fire',              emojis: ['⚡', '🔥'] },
  { name: 'Rainbow',     hint: 'Sunlight through water droplets',      emojis: ['🌈', '💧'] },
  { name: 'Ice',         hint: 'Water frozen by time',                 emojis: ['🧊', '💧'] },
];

function toAppTask(task: ServerTask): AppDailyTask {
  return task;
}

function generateDailyTasks(userFid: number): AppDailyTask[] {
  const today = new Date().toISOString().slice(0, 10);
  const seed = strHash(`${userFid}-${today}`);
  const targetIdx = seed % TARGET_POOL.length;
  const target = TARGET_POOL[targetIdx];
  const craftGoal = [3, 5, 7, 10][seed % 4];

  return [
    {
      id: 'task-gm', type: 'gm_onchain', title: 'Send GM On-Chain',
      description: 'Start your day by sending a GM transaction on any supported EVM chain.',
      icon: '🌅', points: PTS.GM_ONCHAIN, xpReward: 50, craftzReward: 10,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-target', type: 'craft_target', title: "Today's Mystery Craft",
      description: 'Figure out how to craft this specific item using the hint below.',
      icon: '🔮', points: 20, xpReward: 100, craftzReward: 20,
      progress: 0, required: 1, completed: false,
      targetItem: target.name, targetHint: target.hint, targetEmojis: target.emojis,
    },
    {
      id: 'task-crafts', type: 'craft_count', title: `Craft ${craftGoal} Items`,
      description: `Combine elements ${craftGoal} times today. Any combination counts.`,
      icon: '⚗️', points: craftGoal * 2, xpReward: craftGoal * 10, craftzReward: craftGoal * 3,
      progress: 0, required: craftGoal, completed: false,
    },
    {
      id: 'task-rare', type: 'craft_rare', title: 'Craft Something Rare+',
      description: 'Produce at least one RARE or LEGENDARY item today.',
      icon: '💫', points: 15, xpReward: 75, craftzReward: 15,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-legendary', type: 'craft_legendary', title: 'Forge a Legend',
      description: 'Discover or craft any LEGENDARY tier item.',
      icon: '👑', points: 30, xpReward: 150, craftzReward: 25,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-megamind', type: 'mint_megamind', title: 'Mint a MegaMind',
      description: 'Mint any MegaMind NFT you own to the chain.',
      icon: '⚡', points: 40, xpReward: 200, craftzReward: 30,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-discover', type: 'discover_new', title: 'Achieve a MegaMind',
      description: 'Be the first player globally to craft an item that has never existed before.',
      icon: '🌐', points: 50, xpReward: 250, craftzReward: 50,
      progress: 0, required: 1, completed: false,
    },
  ];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CRAFTZ_MAX = 100;
const CRAFTZ_COST = 5;
const CRAFTZ_REGEN_MS = 2500;

const TIER_BADGE: Record<string, string> = {
  GENESIS:   'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  COMMON:    'bg-zinc-700/50 text-zinc-400 border border-zinc-600/40',
  RARE:      'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  LEGENDARY: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

let instanceCounter = 0;
const newId = () => `inst-${++instanceCounter}-${Math.random().toString(36).slice(2, 7)}`;

function renderEmojis(emojis: [string, string?] | string[] | undefined | null): string {
  if (!emojis || !Array.isArray(emojis)) return '';
  return emojis.filter(Boolean).join('');
}

function tierPoints(tier: string): number {
  if (tier === 'LEGENDARY') return PTS.CRAFT_LEGENDARY;
  if (tier === 'RARE') return PTS.CRAFT_RARE;
  return PTS.CRAFT_COMMON;
}

interface PointToast { id: string; message: string; pts: number; color: string }

// ─── Component ───────────────────────────────────────────────────────────────

export function MiniApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('inventory');
  const [inventory, setInventory] = useState<AppInventoryItem[]>(INITIAL_INVENTORY);
  const [canvasItems, setCanvasItems] = useState<AppCanvasItem[]>([]);
  const [combining, setCombining] = useState<{ a: string; b: string } | null>(null);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [myPoints, setMyPoints] = useState(0);
  const [myMegaMinds, setMyMegaMinds] = useState(0);
  const [myCrafts, setMyCrafts] = useState(0);
  const [serverPlayers, setServerPlayers] = useState<ServerPlayer[]>([]);
  const [syncHealth, setSyncHealth] = useState<"syncing" | "live" | "offline">("syncing");
  const [recentDiscoveries, setRecentDiscoveries] = useState<DiscoveryFeedItem[]>([]);
  const [pointToasts, setPointToasts] = useState<PointToast[]>([]);

  const [craftz, setCraftz] = useState(CRAFTZ_MAX);
  const craftzRef = useRef(CRAFTZ_MAX);
  const lastRegenRef = useRef(Date.now());

  // Server-synced global registry — tracks which items have been discovered globally
  const globalRegistryRef = useRef<Set<string>>(new Set());

  // Inventory name set — prevents duplicate items in local inventory
  const inventoryNamesRef = useRef<Set<string>>(new Set(
    INITIAL_INVENTORY.map(i => i.name.toLowerCase().trim())
  ));

  const [dailyTasks, setDailyTasks] = useState<AppDailyTask[]>(() => generateDailyTasks(0));
  const dailyTasksRef = useRef<AppDailyTask[]>([]);
  dailyTasksRef.current = dailyTasks;
  const [gmChain, setGmChain] = useState(EVM_CHAINS[0].id);
  const [gmSending, setGmSending] = useState(false);
  const [gmSent, setGmSent] = useState(false);

  const [mintModal, setMintModal] = useState<{
    uid: string; name: string; emojis: [string, string?]; tier: string; phase: AppMintPhase;
  } | null>(null);
  const mintModalRef = useRef(mintModal);
  mintModalRef.current = mintModal;

  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [mintingPaused, setMintingPaused] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ instanceId: string; startX: number; startY: number; itemX: number; itemY: number } | null>(null);

  const syncFromServerPlayer = useCallback((player?: ServerPlayer | null) => {
    if (!player) return;
    setMyPoints(player.points);
    setMyCrafts(player.crafts);
    setMyMegaMinds(player.megaMinds);
  }, []);

  const refreshServerSnapshot = useCallback(async () => {
    setSyncHealth((prev) => (prev === "live" ? "live" : "syncing"));
    const snapshot = await fetchLeaderboardSnapshot(50);
    if (!snapshot) {
      setSyncHealth("offline");
      return;
    }
    setSyncHealth("live");

    const currentPlayer = snapshot.leaderboard.find(
      (player) => player.fid === 0 || player.agentId === `fid:0`,
    );
    syncFromServerPlayer(currentPlayer);
    setServerPlayers(
      snapshot.leaderboard.filter((player) => player.fid !== 0 && player.agentId !== `fid:0`),
    );

    const feed = toDiscoveryFeed(snapshot.recentActivity);
    if (feed.length > 0) setRecentDiscoveries(feed);
  }, [syncFromServerPlayer]);

  function awardPoints(pts: number, label: string, color = '#f59e0b') {
    setMyPoints((p) => p + pts);
    const id = newId();
    setPointToasts((prev) => [...prev, { id, message: label, pts, color }]);
    setTimeout(() => setPointToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  function advanceTask(type: AppDailyTaskType, by = 1, matchName?: string) {
    const currentTasks = dailyTasksRef.current;
    let progressedTaskId: string | null = null;

    for (const t of currentTasks) {
      if (t.completed) continue;
      if (t.type !== type) continue;
      if (type === 'craft_target' && matchName) {
        if (t.targetItem?.toLowerCase() !== matchName.toLowerCase()) continue;
      }
      if (t.progress < t.required) {
        progressedTaskId = t.id;
        break;
      }
    }

    setDailyTasks((tasks) =>
      tasks.map((t) => {
        if (t.completed) return t;
        if (t.type !== type) return t;
        if (type === 'craft_target' && matchName) {
          if (t.targetItem?.toLowerCase() !== matchName.toLowerCase()) return t;
        }
        const newProg = Math.min(t.required, t.progress + by);
        return { ...t, progress: newProg };
      })
    );

    if (progressedTaskId) {
      void progressTask(0, progressedTaskId, by).then((serverTasks) => {
        if (serverTasks) setDailyTasks(serverTasks.map(toAppTask));
      });
    }
  }

  function claimTask(taskId: string) {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task || task.completed || task.progress < task.required) return;
    setDailyTasks((tasks) => tasks.map((t) => t.id === taskId ? { ...t, completed: true, claimedAt: Date.now() } : t));
    awardPoints(task.points, `Task: ${task.title}`, '#22c55e');
    setCraftz((c) => { const next = Math.min(CRAFTZ_MAX, c + task.craftzReward); craftzRef.current = next; return next; });
    void completeTask(0, taskId).then((serverTasks) => {
      if (serverTasks) setDailyTasks(serverTasks.map(toAppTask));
    });
  }

  // Craftz regen
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastRegenRef.current;
      const add = Math.floor(elapsed / CRAFTZ_REGEN_MS);
      if (add > 0) {
        lastRegenRef.current = now - (elapsed % CRAFTZ_REGEN_MS);
        setCraftz((prev) => { const next = Math.min(CRAFTZ_MAX, prev + add); craftzRef.current = next; return next; });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Hydrate from server
  useEffect(() => {
    void refreshServerSnapshot();
    const interval = setInterval(() => void refreshServerSnapshot(), 15000);
    return () => clearInterval(interval);
  }, [refreshServerSnapshot]);

  useEffect(() => {
    void fetchTasks(0).then((tasks) => {
      if (tasks) setDailyTasks(tasks.map(toAppTask));
    });
  }, []);

  useEffect(() => {
    const gmTask = dailyTasks.find((task) => task.type === 'gm_onchain');
    setGmSent(Boolean(gmTask?.completed));
  }, [dailyTasks]);

  useEffect(() => {
    if (!adminFeedback) return;
    const t = setTimeout(() => setAdminFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [adminFeedback]);

  const megaMindItems = inventory.filter((i) => i.isMegaMind);
  const filteredInventory = inventory.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const tasksCompleted = dailyTasks.filter((t) => t.completed).length;
  const tasksTotal = dailyTasks.length;
  const tasksPendingClaim = dailyTasks.filter((t) => !t.completed && t.progress >= t.required).length;

  const leaderboardData = useMemo(() => {
    const basePlayers = serverPlayers.length > 0
      ? serverPlayers.map((player) => ({
          username: player.username ?? player.agentId,
          pfp: `https://api.dicebear.com/9.x/lorelei/svg?seed=${player.username ?? player.agentId}`,
          points: player.points,
          megaMinds: player.megaMinds,
          crafts: player.crafts,
        }))
      : [];

    const me = {
      username: 'you',
      pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=you',
      points: myPoints,
      megaMinds: myMegaMinds,
      crafts: myCrafts,
    };

    const all = [...basePlayers.filter((p) => p.username !== 'you'), { ...me, rank: 0 }]
      .sort((a, b) => b.points - a.points);

    return all.map((player, index) => ({
      ...player,
      rank: index + 1,
      isCurrentUser: player.username === 'you',
    }));
  }, [myPoints, myMegaMinds, myCrafts, serverPlayers]);

  const myRank = leaderboardData.find((p) => p.isCurrentUser)?.rank ?? (myPoints > 0 ? 1 : '--');
  const syncColor = syncHealth === "live" ? "bg-emerald-400" : syncHealth === "syncing" ? "bg-amber-400" : "bg-red-400";
  const syncLabel = syncHealth === "live" ? "Live" : syncHealth === "syncing" ? "Syncing" : "Offline";

  function addToCanvas(item: AppInventoryItem) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = 44 + Math.random() * (rect.width - 110);
    const y = 30 + Math.random() * (rect.height - 76);
    setCanvasItems((prev) => [...prev, {
      instanceId: newId(), id: item.id, name: item.name, emojis: item.emojis,
      tier: item.tier, isMegaMind: item.isMegaMind, x, y,
    }]);
  }

  const handlePointerDown = useCallback((e: React.PointerEvent, instanceId: string) => {
    e.preventDefault(); e.stopPropagation();
    const item = canvasItems.find((i) => i.instanceId === instanceId);
    if (!item) return;
    dragRef.current = { instanceId, startX: e.clientX, startY: e.clientY, itemX: item.x, itemY: item.y };
    setCanvasItems((prev) => prev.map((i) => i.instanceId === instanceId ? { ...i, isDragging: true } : i));

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const newX = dragRef.current.itemX + (ev.clientX - dragRef.current.startX);
      const newY = dragRef.current.itemY + (ev.clientY - dragRef.current.startY);
      setCanvasItems((prev) => {
        const near = prev.find((i) => i.instanceId !== instanceId && Math.hypot(i.x - newX, i.y - newY) < 58);
        setPulseTarget(near?.instanceId ?? null);
        return prev.map((i) => i.instanceId === instanceId ? { ...i, x: newX, y: newY } : i);
      });
    };

    const onUp = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const finalX = dragRef.current.itemX + (ev.clientX - dragRef.current.startX);
      const finalY = dragRef.current.itemY + (ev.clientY - dragRef.current.startY);
      setPulseTarget(null);

      setCanvasItems((prev) => {
        const dragging = prev.find((i) => i.instanceId === instanceId);
        if (!dragging) return prev;
        const target = prev.find((i) => i.instanceId !== instanceId && Math.hypot(i.x - finalX, i.y - finalY) < 58);

        if (target) {
          if (craftzRef.current < CRAFTZ_COST) {
            return prev.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i);
          }

          // BLOCK: Only genesis items can be combined. No infinite chains.
          if (!isGenesisItem(dragging.id) || !isGenesisItem(target.id)) {
            return prev.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i);
          }

          const midX = (finalX + target.x) / 2;
          const midY = (finalY + target.y) / 2;
          setCombining({ a: instanceId, b: target.instanceId });
          setCraftz((c) => { const next = Math.max(0, c - CRAFTZ_COST); craftzRef.current = next; return next; });

          setTimeout(() => {
            const crafted = craft(dragging.name, target.name, globalRegistryRef.current);

            if (!crafted) {
              setCombining(null);
              setCanvasItems((curr) => curr.map((i) =>
                i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i
              ));
              return;
            }

            const normalizedName = crafted.name.toLowerCase().trim();
            const alreadyInInventory = inventoryNamesRef.current.has(normalizedName);

            // Register in global registry (server will confirm if truly first)
            globalRegistryRef.current.add(normalizedName);

            const pts = tierPoints(crafted.tier) + (crafted.isMegaMind ? PTS.MEGAMIND_BONUS : 0);
            awardPoints(pts,
              crafted.isMegaMind
                ? `⚡ MegaMind! +${pts} pts`
                : `${crafted.tier === 'LEGENDARY' ? '👑' : crafted.tier === 'RARE' ? '💫' : '⚗️'} +${pts} pts`
            );
            setMyCrafts((c) => c + 1);
            if (crafted.isMegaMind) setMyMegaMinds((m) => m + 1);

            advanceTask('craft_count', 1);
            advanceTask('craft_target', 1, crafted.name);
            if (crafted.tier === 'RARE' || crafted.tier === 'LEGENDARY') advanceTask('craft_rare');
            if (crafted.tier === 'LEGENDARY') advanceTask('craft_legendary');
            if (crafted.isMegaMind) advanceTask('discover_new');

            void postCraftEvent({
              fid: 0, username: 'you', itemName: crafted.name,
              tier: crafted.tier as "COMMON" | "RARE" | "LEGENDARY",
              ingredients: [dragging.name, target.name],
              emojis: crafted.emojis.filter((emoji): emoji is string => Boolean(emoji)),
              isMegaMind: crafted.isMegaMind,
              pointsAwarded: pts,
            }).then((player) => {
              syncFromServerPlayer(player);
              if (crafted.isMegaMind) void refreshServerSnapshot();
            });

            const resolvedItem: AppInventoryItem = alreadyInInventory
              ? { uid: `u-existing-${normalizedName}`, id: normalizedName, name: crafted.name, emojis: crafted.emojis, tier: crafted.tier, isMegaMind: false, isMinted: false }
              : { uid: `u-crafted-${newId()}`, id: normalizedName, name: crafted.name, emojis: crafted.emojis, tier: crafted.tier, recipe: crafted.recipe, isMegaMind: crafted.isMegaMind, isMinted: false };

            setCombining(null);

            setCanvasItems((curr) => {
              const filtered = curr.filter((i) => i.instanceId !== instanceId && i.instanceId !== target.instanceId);
              return [...filtered, {
                instanceId: newId(), id: resolvedItem.id, name: resolvedItem.name,
                emojis: resolvedItem.emojis, tier: resolvedItem.tier,
                isMegaMind: resolvedItem.isMegaMind, x: midX, y: midY,
              }];
            });

            if (!alreadyInInventory) {
              inventoryNamesRef.current.add(normalizedName);
              setInventory((inv) => {
                if (inv.find((i) => i.name.toLowerCase().trim() === normalizedName)) return inv;
                return [...inv, resolvedItem];
              });

              if (crafted.isMegaMind && !mintingPaused) {
                setTimeout(() => setMintModal({
                  uid: resolvedItem.uid, name: resolvedItem.name,
                  emojis: resolvedItem.emojis, tier: resolvedItem.tier, phase: 'prompt',
                }), 400);
              }
            }
          }, 650);

          return prev.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i);
        }
        return prev.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i);
      });

      dragRef.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [canvasItems, mintingPaused, refreshServerSnapshot, syncFromServerPlayer]);

  function startMint(item: AppInventoryItem) {
    if (mintingPaused) { setAdminFeedback('Minting is currently paused'); return; }
    setMintModal({ uid: item.uid, name: item.name, emojis: item.emojis, tier: item.tier, phase: 'prompt' });
  }

  function advanceMint() {
    const currentModal = mintModalRef.current;
    if (!currentModal) return;
    if (currentModal.phase === 'prompt') {
      setMintModal((m) => m ? { ...m, phase: 'connecting' } : null);
      setTimeout(() => setMintModal((m) => m ? { ...m, phase: 'minting' } : null), 1200);
      setTimeout(() => {
        const tokenId = Math.floor(Math.random() * 9000) + 100;
        const modalAtTimeout = mintModalRef.current;
        if (!modalAtTimeout) return;
        setMintModal((m) => m ? { ...m, phase: 'done' } : null);
        setInventory((inv) => inv.map((i) =>
          i.uid === modalAtTimeout.uid ? { ...i, isMinted: true, tokenId } : i
        ));
        awardPoints(PTS.MINT_MEGAMIND, '🎨 Minted! +25 pts', '#22c55e');
        advanceTask('mint_megamind');
        void postMintEvent({ fid: 0, username: 'you', itemName: modalAtTimeout.name, tokenId }).then((player) => {
          syncFromServerPlayer(player);
          void refreshServerSnapshot();
        });
      }, 3000);
    } else if (currentModal.phase === 'done') {
      setMintModal(null);
    }
  }

  function sendGm() {
    if (gmSent || gmSending) return;
    setGmSending(true);
    setTimeout(() => {
      setGmSending(false);
      setGmSent(true);
      awardPoints(PTS.GM_ONCHAIN, '🌅 GM! +10 pts', '#a855f7');
      advanceTask('gm_onchain');
      void postGmEvent({ fid: 0, username: 'you', chain: gmChain }).then((player) => syncFromServerPlayer(player));
    }, 1800);
  }

  function clearCanvas() { setCanvasItems([]); setCombining(null); }
  function adminAction(msg: string) { setAdminFeedback(msg); }

  const craftzColor = craftz > 49 ? '#22c55e' : craftz > 19 ? '#eab308' : '#ef4444';
  const craftzLow = craftz < CRAFTZ_COST;

  function starColor(tier: string, isMegaMind?: boolean): string | null {
    if (tier === 'LEGENDARY' || isMegaMind) return '#f59e0b';
    if (tier === 'RARE') return '#a1a1aa';
    if (tier === 'COMMON') return '#e4e4e7';
    return null;
  }

  const tabs: Array<{ id: AppTab; label: string; badge: string | number | null; badgeAlert: boolean }> = [
    { id: 'inventory',   label: '📚 Items',    badge: inventory.length,    badgeAlert: false },
    { id: 'megaminds',   label: '💎 Mega',     badge: megaMindItems.length, badgeAlert: false },
    { id: 'tasks',       label: '✅ Tasks',    badge: `${tasksCompleted}/${tasksTotal}`, badgeAlert: tasksPendingClaim > 0 },
    { id: 'leaderboard', label: '🏆 Board',   badge: null,                badgeAlert: false },
  ];

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-zinc-950 text-white" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      {/* Point Toasts */}
      <div className="fixed top-14 right-3 z-50 flex flex-col gap-1 pointer-events-none">
        {pointToasts.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl animate-bounce-in text-xs font-bold" style={{ color: t.color }}>
            +{t.pts} <span className="text-zinc-300 font-normal">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Mint Modal */}
      {mintModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm px-4 pb-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            {mintModal.phase === 'prompt' && (
              <>
                <p className="text-amber-400 font-bold text-xs tracking-[0.15em] uppercase mb-3">🎉 MegaMind Discovery!</p>
                <div className="text-6xl my-4">{renderEmojis(mintModal.emojis)}</div>
                <p className="text-white font-bold text-xl">{mintModal.name}</p>
                <div className="flex items-center justify-center gap-2 mt-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TIER_BADGE[mintModal.tier]}`}>{mintModal.tier}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">⚡ MEGAMIND</span>
                </div>
                <p className="text-zinc-600 text-xs mt-1 mb-4">First ever creation of this item globally</p>
                <div className="bg-zinc-800/60 rounded-xl p-4 text-left mb-5 space-y-2">
                  <p className="text-sm text-zinc-300">✓ <span className="text-white">+15 bonus points</span></p>
                  <p className="text-sm text-zinc-300">✓ <span className="text-white">Permanently on-chain</span></p>
                  <p className="text-sm text-zinc-300">✓ <span className="text-white">Proof you discovered it first</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setMintModal(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 transition-colors">Skip</button>
                  <button onClick={advanceMint} className="flex-1 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 transition-colors">🎨 Mint NFT</button>
                </div>
              </>
            )}
            {mintModal.phase === 'connecting' && (
              <div className="py-6">
                <div className="text-5xl mb-4 animate-pulse">👛</div>
                <p className="text-white font-semibold">Connecting wallet…</p>
                <p className="text-zinc-500 text-xs mt-2">Approve in your wallet</p>
              </div>
            )}
            {mintModal.phase === 'minting' && (
              <div className="py-6">
                <div className="text-5xl mb-4">{renderEmojis(mintModal.emojis)}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white font-semibold">Minting…</p>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Confirm the transaction in your wallet</p>
              </div>
            )}
            {mintModal.phase === 'done' && (
              <>
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-emerald-400 font-bold text-lg mb-1">Minted!</p>
                <p className="text-white font-semibold">{mintModal.name}</p>
                <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TIER_BADGE[mintModal.tier]}`}>{mintModal.tier}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">✓ NFT</span>
                </div>
                <p className="text-zinc-500 text-xs mb-5">Your discovery is permanently on-chain. +25 pts awarded.</p>
                <button onClick={() => setMintModal(null)} className="w-full py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin Feedback Toast */}
      {adminFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 shadow-xl">
          <p className="text-white text-sm font-semibold">{adminFeedback}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-white">CrafterZ</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${syncColor}`} />
            {syncLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">Rank <span className="text-white font-bold">#{myRank}</span></div>
          <div className="w-px h-3 bg-zinc-700" />
          <span className="text-amber-400 text-xs font-bold">{myPoints.toLocaleString()} pts</span>
          <img src="https://api.dicebear.com/9.x/lorelei/svg?seed=you" className="w-7 h-7 rounded-full border border-zinc-700" alt="" />
        </div>
      </div>

      {/* Canvas — expanded size */}
      <div ref={canvasRef} className="relative flex-shrink-0 bg-zinc-950 border-b border-zinc-800 overflow-hidden" style={{ height: 280 }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, #71717a 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        {canvasItems.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <span className="text-2xl opacity-25">✨</span>
            <p className="text-zinc-600 text-xs text-center leading-relaxed">Tap a genesis element below to place it here<br />then drag one onto another to combine</p>
          </div>
        )}

        {craftzLow && canvasItems.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-red-950/80 border border-red-700/50 rounded-lg px-3 py-1 pointer-events-none">
            <p className="text-red-400 text-xs font-semibold">Not enough Craftz to combine!</p>
          </div>
        )}

        {canvasItems.length > 0 && (
          <button onClick={clearCanvas} className="absolute top-2 right-2 z-10 text-zinc-600 text-xs bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800 hover:text-zinc-300 transition-colors">Clear</button>
        )}

        {canvasItems.map((item) => {
          const isCombining = combining && (combining.a === item.instanceId || combining.b === item.instanceId);
          const isPulse = pulseTarget === item.instanceId;
          const sc = starColor(item.tier, item.isMegaMind);
          return (
            <div
              key={item.instanceId}
              onPointerDown={(e) => handlePointerDown(e, item.instanceId)}
              className="absolute select-none"
              style={{ left: item.x, top: item.y, transform: `translate(-50%,-50%) scale(${item.isDragging ? 1.12 : 1})`, transition: item.isDragging ? 'none' : 'transform 0.12s ease', zIndex: item.isDragging ? 20 : 10, touchAction: 'none', cursor: 'grab' }}
            >
              <div className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 border backdrop-blur-sm ${isCombining ? 'bg-amber-900/50 border-amber-400 animate-pulse' : isPulse ? 'bg-yellow-900/50 border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-zinc-900/95 border-zinc-700 shadow-md shadow-black/60'}`} style={{ minWidth: 52 }}>
                {sc && <span className="absolute -top-1.5 -right-1.5 text-[11px] leading-none" style={{ color: sc, textShadow: `0 0 5px ${sc}88` }}>★</span>}
                <span className="text-xl leading-none tracking-tight">{renderEmojis(item.emojis)}</span>
                <span className="text-white text-xs font-semibold text-center leading-tight">{item.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Craftz Bar */}
      <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500">⚡ Craftz <span style={{ color: craftzColor }} className="font-mono font-semibold">{craftz}/{CRAFTZ_MAX}</span>{craftzLow && <span className="text-red-500 ml-1.5 font-semibold">· need {CRAFTZ_COST}</span>}</span>
          <span className="text-xs text-zinc-600">+1 per 2.5s · costs {CRAFTZ_COST} to craft</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(craftz / CRAFTZ_MAX) * 100}%`, backgroundColor: craftzColor }} />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[11px] font-semibold transition-colors flex flex-col items-center justify-center gap-0.5 relative ${activeTab === tab.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab.badgeAlert && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
            <span>{tab.label}</span>
            {tab.badge !== null && <span className="text-zinc-600 text-[9px]">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
        {activeTab === 'inventory' && (
          <InventoryTab searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} filteredInventory={filteredInventory} onAddToCanvas={addToCanvas} renderEmojis={renderEmojis} tierBadge={TIER_BADGE} />
        )}
        {activeTab === 'megaminds' && (
          <MegaMindsTab megaMindItems={megaMindItems} renderEmojis={renderEmojis} tierBadge={TIER_BADGE} onStartMint={startMint} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab dailyTasks={dailyTasks} tasksCompleted={tasksCompleted} tasksTotal={tasksTotal} gmChain={gmChain} evmChains={EVM_CHAINS} gmSent={gmSent} gmSending={gmSending} onSelectGmChain={setGmChain} onSendGm={sendGm} onClaimTask={claimTask} renderEmojis={renderEmojis} />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab myRank={typeof myRank === 'number' ? myRank : 99} leaderboardData={leaderboardData} recentDiscoveries={recentDiscoveries} renderEmojis={renderEmojis} tierBadge={TIER_BADGE} points={PTS} />
        )}
      </div>
    </div>
  );
}
