import type { AppInventoryItem, EmojiRenderer } from '../app-types';

export function MegaMindsTab({
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
        <div
          key={item.uid}
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
          <div className="text-right flex-shrink-0">
            {item.isMinted ? (
              <div>
                <p className="text-amber-400 font-bold text-sm">25 pts</p>
                <button className="text-emerald-400 text-xs mt-1 hover:text-emerald-300">View →</button>
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
      ))}
    </div>
  );
}
