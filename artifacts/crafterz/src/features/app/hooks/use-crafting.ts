import { useState, useRef, useCallback, useEffect } from 'react';
import { craftFallback, aiCraft } from '../crafting-engine';
import type { DiscoveredItem } from '../crafting-engine';
import { postCraftEvent } from '../runtime-api';
import type { AppInventoryItem, AppCanvasItem, AppDailyTaskType } from '../app-types';
import { newId, tierPoints } from '../helpers';
import { CRAFTZ_COST, CRAFTZ_MAX, PTS, INITIAL_INVENTORY } from '../constants';
import type { ServerPlayer } from '../runtime-api';

export interface UseCraftingOptions {
  craftzRef: React.MutableRefObject<number>;
  setCraftz: React.Dispatch<React.SetStateAction<number>>;
  mintingPaused: boolean;
  username: string;
  onMegaMindFound: (uid: string, name: string, emoji: string, tier: string) => void;
  onAwardPoints: (pts: number, label: string, color?: string) => void;
  onAdvanceTask: (type: AppDailyTaskType, by?: number, matchName?: string) => void;
  onSetMyCrafts: React.Dispatch<React.SetStateAction<number>>;
  onSetMyMegaMinds: React.Dispatch<React.SetStateAction<number>>;
  onSyncFromServerPlayer: (player?: ServerPlayer | null) => void;
  onRefreshServerSnapshot: () => Promise<void>;
}

export interface UseCraftingReturn {
  inventory: AppInventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<AppInventoryItem[]>>;
  canvasItems: AppCanvasItem[];
  setCanvasItems: React.Dispatch<React.SetStateAction<AppCanvasItem[]>>;
  combining: { a: string; b: string } | null;
  pulseTarget: string | null;
  aiEnabled: boolean | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  addToCanvas: (item: AppInventoryItem) => void;
  clearCanvas: () => void;
  handlePointerDown: (e: React.PointerEvent, instanceId: string) => void;
}

export function useCrafting(opts: UseCraftingOptions): UseCraftingReturn {
  const {
    craftzRef, setCraftz, mintingPaused, username,
    onMegaMindFound, onAwardPoints, onAdvanceTask,
    onSetMyCrafts, onSetMyMegaMinds,
    onSyncFromServerPlayer, onRefreshServerSnapshot,
  } = opts;

  const [inventory, setInventory] = useState<AppInventoryItem[]>(INITIAL_INVENTORY);
  const [canvasItems, setCanvasItems] = useState<AppCanvasItem[]>([]);
  const [combining, setCombining] = useState<{ a: string; b: string } | null>(null);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ instanceId: string; startX: number; startY: number; itemX: number; itemY: number } | null>(null);
  const craftingRef = useRef(false);
  const globalRegistryRef = useRef<Set<string>>(new Set());
  const inventoryNamesRef = useRef<Set<string>>(
    new Set(INITIAL_INVENTORY.map((i) => i.name.toLowerCase().trim())),
  );
  const inventoryRef = useRef<AppInventoryItem[]>(inventory);
  inventoryRef.current = inventory;

  // Probe: only returns false if AI_API_KEY is explicitly missing
  useEffect(() => {
    fetch('/api/ai-craft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemA: 'test', itemB: 'check', genA: 0, genB: 0, discoveredItems: [] }),
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; error?: string }) => {
        setAiEnabled(!d.error?.includes('AI_API_KEY'));
      })
      .catch(() => setAiEnabled(false));
  }, []);

  const addToCanvas = useCallback((item: AppInventoryItem) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = 44 + Math.random() * (rect.width - 110);
    const y = 30 + Math.random() * (rect.height - 76);
    setCanvasItems((prev) => [...prev, {
      instanceId: newId(), id: item.id, name: item.name, emoji: item.emoji,
      tier: item.tier, generation: item.generation, isMegaMind: item.isMegaMind, x, y,
    }]);
  }, []);

  const clearCanvas = useCallback(() => {
    setCanvasItems([]);
    setCombining(null);
    craftingRef.current = false;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, instanceId: string) => {
    e.preventDefault();
    e.stopPropagation();

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
          if (craftzRef.current < CRAFTZ_COST || craftingRef.current) {
            return prev.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i);
          }

          craftingRef.current = true;
          const midX = (finalX + target.x) / 2;
          const midY = (finalY + target.y) / 2;
          setCombining({ a: instanceId, b: target.instanceId });
          // Craftz charged only after confirmed result

          void (async () => {
            let crafted = null;

            if (aiEnabled) {
              const discoveredItems: DiscoveredItem[] = inventoryRef.current
                .filter((i) => i.tier !== 'GENESIS')
                .map((i) => ({ name: i.name, tier: i.tier, generation: i.generation, emoji: i.emoji }));
              const aiResult = await aiCraft(dragging.name, target.name, dragging.generation, target.generation, discoveredItems);
              if (aiResult.ok && aiResult.result) {
                crafted = {
                  name: aiResult.result.name, emoji: aiResult.result.emoji,
                  tier: aiResult.result.tier, isMegaMind: aiResult.result.isMegaMind,
                  recipe: `${dragging.name} + ${target.name}`, generation: aiResult.result.generation,
                };
              } else {
                crafted = craftFallback(dragging.name, target.name, dragging.generation, target.generation, globalRegistryRef.current);
              }
            } else {
              crafted = craftFallback(dragging.name, target.name, dragging.generation, target.generation, globalRegistryRef.current);
            }

            if (!crafted) {
              craftingRef.current = false;
              setCombining(null);
              setCanvasItems((curr) => curr.map((i) => i.instanceId === instanceId ? { ...i, x: finalX, y: finalY, isDragging: false } : i));
              return;
            }

            // Recipe found — deduct Craftz now
            setCraftz((c) => { const next = Math.max(0, c - CRAFTZ_COST); craftzRef.current = next; return next; });

            const normalizedName = crafted.name.toLowerCase().trim();
            const alreadyInInventory = inventoryNamesRef.current.has(normalizedName);
            globalRegistryRef.current.add(normalizedName);

            const pts = tierPoints(crafted.tier) + (crafted.isMegaMind ? PTS.MEGAMIND_BONUS : 0);
            onAwardPoints(pts,
              crafted.isMegaMind
                ? `⚡ MegaMind! +${pts} pts`
                : `${crafted.tier === 'LEGENDARY' ? '👑' : crafted.tier === 'RARE' ? '💫' : '⚗️'} +${pts} pts`,
            );
            onSetMyCrafts((c) => c + 1);
            if (crafted.isMegaMind) onSetMyMegaMinds((m) => m + 1);

            onAdvanceTask('craft_count', 1);
            onAdvanceTask('craft_target', 1, crafted.name);
            if (crafted.tier === 'RARE' || crafted.tier === 'LEGENDARY') onAdvanceTask('craft_rare');
            if (crafted.tier === 'LEGENDARY') onAdvanceTask('craft_legendary');
            if (crafted.isMegaMind) onAdvanceTask('discover_new');

            void postCraftEvent({
              fid: 0, username,
              itemName: crafted.name,
              tier: crafted.tier as 'COMMON' | 'RARE' | 'LEGENDARY',
              ingredients: [dragging.name, target.name],
              emojis: [crafted.emoji],
              isMegaMind: crafted.isMegaMind,
              pointsAwarded: pts,
            }).then((player) => {
              onSyncFromServerPlayer(player);
              if (crafted!.isMegaMind) void onRefreshServerSnapshot();
            });

            const resolvedItem: AppInventoryItem = alreadyInInventory
              ? { uid: `u-existing-${normalizedName}`, id: normalizedName, name: crafted.name, emoji: crafted.emoji, tier: crafted.tier, generation: crafted.generation, isMegaMind: false, isMinted: false }
              : { uid: `u-crafted-${newId()}`, id: normalizedName, name: crafted.name, emoji: crafted.emoji, tier: crafted.tier, recipe: crafted.recipe, generation: crafted.generation, isMegaMind: crafted.isMegaMind, isMinted: false };

            craftingRef.current = false;
            setCombining(null);
            setCanvasItems((curr) => {
              const filtered = curr.filter((i) => i.instanceId !== instanceId && i.instanceId !== target.instanceId);
              return [...filtered, {
                instanceId: newId(), id: resolvedItem.id, name: resolvedItem.name,
                emoji: resolvedItem.emoji, tier: resolvedItem.tier,
                generation: resolvedItem.generation, isMegaMind: resolvedItem.isMegaMind,
                x: midX, y: midY,
              }];
            });

            if (!alreadyInInventory) {
              inventoryNamesRef.current.add(normalizedName);
              setInventory((inv) => {
                if (inv.find((i) => i.name.toLowerCase().trim() === normalizedName)) return inv;
                return [...inv, resolvedItem];
              });
              if (crafted.isMegaMind && !mintingPaused) {
                setTimeout(() => onMegaMindFound(resolvedItem.uid, resolvedItem.name, resolvedItem.emoji, resolvedItem.tier), 400);
              }
            }
          })();

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
  }, [canvasItems, aiEnabled, mintingPaused, username, craftzRef, setCraftz, onAwardPoints, onAdvanceTask, onSetMyCrafts, onSetMyMegaMinds, onSyncFromServerPlayer, onRefreshServerSnapshot, onMegaMindFound]);

  return {
    inventory, setInventory,
    canvasItems, setCanvasItems,
    combining, pulseTarget, aiEnabled,
    canvasRef, addToCanvas, clearCanvas, handlePointerDown,
  };
}
