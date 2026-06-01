import type { AppInventoryItem, EmojiRenderer } from '../app-types';

export function InventoryTab({
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">🔍</span>
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
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
              <span className="text-amber-400 text-[9px] font-bold leading-none">⚡ MEGA</span>
            )}
            {item.isMinted && (
              <span className="text-emerald-400 text-[9px] font-bold leading-none">✓ MINTED</span>
            )}
            <span className="text-2xl leading-none">{renderEmojis(item.emojis)}</span>
            <span className="text-white text-[11px] font-semibold text-center leading-tight">{item.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tierBadge[item.tier]}`}>{item.tier}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
