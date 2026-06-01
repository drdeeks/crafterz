import { StatCard, AdminAction } from '../ui-primitives';
import type { AdminStats } from '../app-types';

export function AdminTab({
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
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30">MINTING PAUSED</span>
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
                  type="number" min="0" step="0.001" value={mintPriceDraft}
                  onChange={(e) => onChangeMintPriceDraft(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  placeholder="0.001"
                />
                <button onClick={onApplyMintPrice} className="px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 transition-colors">Set</button>
                <button onClick={onCancelMintPriceInput} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">✕</button>
              </div>
              <p className="text-zinc-600 text-[10px]">Enter 0 for free mints. Calls setMintPrice() on the contract.</p>
            </div>
          )}
          <AdminAction icon="🚫" label="Revoke MegaMind" desc="Remove MegaMind status from a specific item" variant="danger" onClick={() => onAdminAction('Revoke MegaMind → opens item selector')} />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Airdrops & Tokens</p>
        <div className="space-y-2">
          <AdminAction icon="⚡" label="Airdrop Craftz" desc="Send in-game Craftz tokens to selected users or all players" onClick={() => onAdminAction('Airdrop Craftz → select recipients')} />
          <AdminAction icon="🪙" label="Airdrop ERC-20 Token" desc="Send any EVM token to a user list via CSV or FID range" onClick={() => onAdminAction('ERC-20 airdrop → token selector')} />
          <AdminAction icon="🎁" label="Airdrop NFT" desc="Send a specific MegaMind NFT token to target wallets" onClick={() => onAdminAction('NFT airdrop → token ID selector')} />
          <AdminAction icon="💰" label="Batch Transfer ETH" desc="Send ETH to multiple wallet addresses from contract" onClick={() => onAdminAction('Batch ETH transfer → address list')} />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Contract Actions</p>
        <div className="space-y-2">
          <AdminAction icon="📝" label="Call Contract Function" desc="Manually invoke any contract function with ABI params" onClick={() => onAdminAction('Contract caller → ABI function picker')} />
          <AdminAction icon="🔄" label="Update Contract Address" desc="Point the app to a new deployed contract address" onClick={() => onAdminAction('Update contract → address input')} />
          <AdminAction icon="📊" label="View On-Chain Events" desc="Tail live events: Minted, Transferred, Burned" onClick={() => onAdminAction('Event log → chain explorer')} />
          <AdminAction icon="🔑" label="Transfer Ownership" desc="Transfer contract ownership to a new wallet address" variant="danger" onClick={() => onAdminAction('Transfer ownership → requires wallet confirm')} />
        </div>
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Platform Controls</p>
        <div className="space-y-2">
          <AdminAction icon="🛑" label="Pause All Crafting" desc="Disable word combination for all users (maintenance)" variant="danger" onClick={() => onAdminAction('⚠️ All crafting paused')} />
          <AdminAction icon="🧹" label="Clear Word Registry" desc="Remove all dynamically generated items from global DB" variant="danger" onClick={() => onAdminAction('Clear registry → requires confirmation')} />
          <AdminAction icon="📢" label="Broadcast Notification" desc="Send a Farcaster frame notification to all users" onClick={() => onAdminAction('Notification composer → opens')} />
          <AdminAction icon="📈" label="Export Analytics CSV" desc="Download full craft history, user stats, mint records" onClick={() => onAdminAction('Exporting analytics…')} />
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
}
