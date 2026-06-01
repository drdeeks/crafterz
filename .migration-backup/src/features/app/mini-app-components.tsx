import { memo } from 'react';
import { EvmChainOption, AppCanvasItem, AppInventoryItem, EmojiRenderer } from './app-types';

// ─── Header Component ────────────────────────────────────────────────────────

export const AppHeader = memo(function AppHeader({
  syncColor,
  syncLabel,
  isAdmin,
  myRank,
  myPoints,
  username,
}: {
  syncColor: string;
  syncLabel: string;
  isAdmin: boolean;
  myRank: number;
  myPoints: number;
  username: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-white">CrafterZ</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${syncColor}`} />
          {syncLabel}
        </span>
        {isAdmin && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">Admin</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">Rank <span className="text-white font-bold">#{myRank}</span></div>
        <div className="w-px h-3 bg-zinc-700" />
        <span className="text-amber-400 text-xs font-bold">{myPoints.toLocaleString()} pts</span>
        <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${username}`} className="w-7 h-7 rounded-full border border-zinc-700" alt="" />
      </div>
    </div>
  );
});

// ─── Crafting Canvas Component ────────────────────────────────────────────────

export const CraftingCanvas = memo(function CraftingCanvas({
  canvasRef,
  canvasItems,
  craftzLow,
  onClearCanvas,
  onPointerDown,
  combining,
  pulseTarget,
  renderEmojis,
  starColor,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasItems: AppCanvasItem[];
  craftzLow: boolean;
  onClearCanvas: () => void;
  onPointerDown: (e: React.PointerEvent, instanceId: string) => void;
  combining: { a: string; b: string } | null;
  pulseTarget: string | null;
  renderEmojis: EmojiRenderer;
  starColor: (tier: string, isMegaMind?: boolean) => string | null;
}) {
  return (
    <div ref={canvasRef} className="relative flex-shrink-0 bg-zinc-950 border-b border-zinc-800 overflow-hidden" style={{ height: 210 }}>
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, #71717a 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

      {canvasItems.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
          <span className="text-2xl opacity-25">✨</span>
          <p className="text-zinc-600 text-xs text-center leading-relaxed">Tap an item below to place it here<br />then drag one onto another to combine</p>
        </div>
      )}

      {craftzLow && canvasItems.length > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-red-950/80 border border-red-700/50 rounded-lg px-3 py-1 pointer-events-none">
          <p className="text-red-400 text-xs font-semibold">Not enough Craftz to combine!</p>
        </div>
      )}

      {canvasItems.length > 0 && (
        <button onClick={onClearCanvas} className="absolute top-2 right-2 z-10 text-zinc-600 text-xs bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800 hover:text-zinc-300 transition-colors">Clear</button>
      )}

      {canvasItems.map((item) => {
        const isCombining = combining && (combining.a === item.instanceId || combining.b === item.instanceId);
        const isPulse = pulseTarget === item.instanceId;
        const sc = starColor(item.tier, item.isMegaMind);
        return (
          <div
            key={item.instanceId}
            onPointerDown={(e) => onPointerDown(e, item.instanceId)}
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
  );
});

// ─── Craftz Bar Component ───────────────────────────────────────────────────

export const CraftzBar = memo(function CraftzBar({
  craftz,
  craftzMax,
  craftzCost,
  craftzColor,
  craftzLow,
}: {
  craftz: number;
  craftzMax: number;
  craftzCost: number;
  craftzColor: string;
  craftzLow: boolean;
}) {
  return (
    <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-500">⚡ Craftz <span style={{ color: craftzColor }} className="font-mono font-semibold">{craftz}/{craftzMax}</span>{craftzLow && <span className="text-red-500 ml-1.5 font-semibold">· need {craftzCost}</span>}</span>
        <span className="text-xs text-zinc-600">+1 per 2.5s · costs {craftzCost} to craft</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(craftz / craftzMax) * 100}%`, backgroundColor: craftzColor }} />
      </div>
    </div>
  );
});
