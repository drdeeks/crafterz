import type { AppInventoryItem } from '../app-types';

export function InventoryTab({
  searchQuery,
  onSearchQueryChange,
  filteredInventory,
  onAddToCanvas,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredInventory: AppInventoryItem[];
  onAddToCanvas: (item: AppInventoryItem) => void;
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

      <div className="flex flex-wrap gap-2">
        {filteredInventory.map((item) => (
          <button
            key={item.uid}
            onClick={() => onAddToCanvas(item)}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all active:scale-95 select-none
              ${item.isMegaMind && !item.isMinted
                ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                : item.isMinted
                  ? 'bg-emerald-950/20 border-emerald-600/40 hover:border-emerald-500'
                  : item.tier === 'LEGENDARY'
                    ? 'bg-amber-900/10 border-amber-700/30 hover:border-amber-600/50'
                    : item.tier === 'RARE'
                      ? 'bg-blue-900/10 border-blue-700/30 hover:border-blue-600/50'
                      : item.tier === 'GENESIS'
                        ? 'bg-purple-900/10 border-purple-700/30 hover:border-purple-600/50'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
              }`}
          >
            {item.isMegaMind && !item.isMinted && (
              <span className="absolute -top-1.5 -right-0.5 text-[11px] leading-none text-amber-400" style={{ textShadow: '0 0 6px #f59e0b88' }}>★</span>
            )}
            {item.isMinted && (
              <span className="absolute -top-1.5 -right-0.5 text-[11px] leading-none text-emerald-400">✓</span>
            )}

            <span className="text-lg leading-none">{item.emoji}</span>
            <span className={`text-sm font-semibold leading-none whitespace-nowrap
              ${item.isMegaMind && !item.isMinted ? 'text-amber-200' : item.isMinted ? 'text-emerald-200' : 'text-white'}`}>
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">No items found</div>
      )}
    </div>
  );
}
