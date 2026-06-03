import { useState } from 'react';
import type { AppInventoryItem } from '../app-types';

type TierFilter = 'all' | 'GENESIS' | 'LEGENDARY' | 'RARE' | 'COMMON';

const TIER_FILTER_OPTIONS: Array<{ id: TierFilter; label: string; color: string }> = [
  { id: 'all', label: 'All', color: 'bg-zinc-700 text-zinc-300' },
  { id: 'GENESIS', label: '✨ Genesis', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  { id: 'LEGENDARY', label: '⭐ Legendary', color: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' },
  { id: 'RARE', label: '💙 Rare', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  { id: 'COMMON', label: 'Common', color: 'bg-zinc-700/50 text-zinc-400' },
];

function TierStats({ inventory }: { inventory: AppInventoryItem[] }) {
  const genesis = inventory.filter(i => i.tier === 'GENESIS').length;
  const legendary = inventory.filter(i => i.tier === 'LEGENDARY').length;
  const rare = inventory.filter(i => i.tier === 'RARE').length;
  const megaMinds = inventory.filter(i => i.isMegaMind).length;

  if (inventory.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-1 py-1 text-[10px] text-zinc-600 flex-wrap">
      <span>{inventory.length} items</span>
      {genesis > 0 && <span className="text-amber-400">✨ {genesis} Genesis</span>}
      {legendary > 0 && <span className="text-violet-400">⭐ {legendary} Legendary</span>}
      {rare > 0 && <span className="text-blue-400">💙 {rare} Rare</span>}
      {megaMinds > 0 && <span className="text-amber-300">⚡ {megaMinds} MegaMind</span>}
    </div>
  );
}

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
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const tierFiltered = tierFilter === 'all'
    ? filteredInventory
    : filteredInventory.filter(i => i.tier === tierFilter);

  const hasMegaMinds = filteredInventory.some(i => i.isMegaMind);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">🔍</span>
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {TIER_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTierFilter(opt.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors whitespace-nowrap ${
              tierFilter === opt.id
                ? (opt.id === 'all' ? 'bg-amber-400 text-zinc-900' : opt.color)
                : 'bg-zinc-800/60 text-zinc-600 hover:bg-zinc-800'
            } ${tierFilter !== opt.id && opt.id !== 'all' ? 'border border-zinc-800' : ''}`}
          >
            {opt.label}
          </button>
        ))}
        {hasMegaMinds && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-700/30 hover:bg-amber-950/60 whitespace-nowrap"
          >
            ⚡ MegaMinds
          </button>
        )}
      </div>

      <TierStats inventory={filteredInventory} />

      <div className="flex flex-wrap gap-2">
        {tierFiltered.map((item) => (
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

      {tierFiltered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-600 text-sm">
            {tierFilter !== 'all' ? `No ${tierFilter.toLowerCase()} items yet` : 'No items found'}
          </p>
          {tierFilter !== 'all' && (
            <button
              onClick={() => setTierFilter('all')}
              className="text-zinc-500 text-xs mt-1 underline"
            >
              Show all items
            </button>
          )}
        </div>
      )}

      <div className="pb-2" />
    </div>
  );
}
