"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type WhitelistAddress = {
  address: string;
  isWhitelisted: boolean;
};

// Custom hook to check if current user is owner
function useIsOwner(address?: string): boolean {
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    if (address) {
      // In a real implementation, you would call an API to check ownership
      // For now, we'll assume the owner check happens server-side
      // This component should only render for the owner
      setIsOwner(true);
    }
  }, [address]);
  
  return isOwner;
}

// Fetch whitelist status for current address
export function useWhitelistStatus(address?: string) {
  const { data, isLoading, error } = useQuery<WhitelistAddress>({
    queryKey: ["whitelist", address],
    enabled: !!address,
    queryFn: async () => {
      const response = await fetch(`/api/admin/x402/whitelist?address=${address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch whitelist status");
      }
      return response.json();
    },
  });
  
  return {
    data,
    isLoading,
    error,
    isWhitelisted: data?.isWhitelisted || false,
  };
}

// Fetch full whitelist (owner only)
export function useFullWhitelist() {
  const { data, isLoading, error } = useQuery<{ whitelist: string[]; owner: string }>({
    queryKey: ["full-whitelist"],
    queryFn: async () => {
      const response = await fetch("/api/admin/x402/whitelist");
      if (!response.ok) {
        throw new Error("Failed to fetch whitelist");
      }
      return response.json();
    },
  });
  
  return {
    data,
    isLoading,
    error,
    whitelist: data?.whitelist || [],
  };
}

// Mutation to add address to whitelist
export function useAddToWhitelist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch("/api/admin/x402/whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add to whitelist");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-whitelist"] });
      queryClient.invalidateQueries({ queryKey: ["whitelist"] });
    },
  });
}

// Mutation to remove address from whitelist
export function useRemoveFromWhitelist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch("/api/admin/x402/whitelist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove from whitelist");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["full-whitelist"] });
      queryClient.invalidateQueries({ queryKey: ["whitelist"] });
    },
  });
}

// Main Whitelist Admin Component (Visible only to owner)
export function X402WhitelistAdmin({ userAddress }: { userAddress?: string }) {
  const [newAddress, setNewAddress] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const { data, isLoading, error, whitelist } = useFullWhitelist();
  const addMutation = useAddToWhitelist();
  const removeMutation = useRemoveFromWhitelist();
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!newAddress) {
      setMessage({ type: "error", text: "Please enter an address" });
      return;
    }
    
    try {
      await addMutation.mutateAsync(newAddress);
      setMessage({ type: "success", text: `Added ${newAddress} to whitelist` });
      setNewAddress("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to add" });
    }
  };
  
  const handleRemove = async (address: string) => {
    if (!confirm(`Remove ${address} from whitelist?`)) return;
    
    try {
      await removeMutation.mutateAsync(address);
      setMessage({ type: "success", text: `Removed ${address} from whitelist` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove" });
    }
  };
  
  // Note: In production, you should verify userAddress is the owner
  // via a signed message or server-side check
  const isOwner = true; // Simplified for this example
  
  if (!isOwner) {
    return null; // Invisible to non-owners
  }
  
  return (
    <div className="x402-whitelist-admin bg-gray-900 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🏆 X402 Mint Whitelist Admin</h2>
      
      <div className="mb-4 p-3 bg-blue-900/50 rounded">
        <p className="text-sm">
          Whitelisted addresses can mint MegaMinds for <strong>FREE</strong> (gas only).
          Normal users pay <strong>$0.05</strong> per MegaMind.
        </p>
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleAdd} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x... or Solana address"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded font-medium transition-colors"
          >
            {addMutation.isPending ? "Adding..." : "Add to Whitelist"}
          </button>
        </div>
      </form>
      
      {isLoading ? (
        <p className="text-gray-400">Loading whitelist...</p>
      ) : error ? (
        <p className="text-red-400">Error: {(error as Error).message}</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Whitelisted Addresses ({whitelist.length})</h3>
          
          {whitelist.length === 0 ? (
            <p className="text-gray-400 text-sm">No addresses whitelisted yet</p>
          ) : (
            <ul className="space-y-2">
              {whitelist.map((addr, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-800 rounded"
                >
                  <code className="text-sm">{addr}</code>
                  <button
                    onClick={() => handleRemove(addr)}
                    disabled={removeMutation.isPending}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-400">
        <p>
          Note: In production, whitelist is managed via <code>X402_MINT_WHITELIST</code> 
          environment variable or a smart contract. This UI provides a user-friendly 
          interface but changes require server restart or contract interaction.
        </p>
      </div>
    </div>
  );
}

// User-facing whitelist check component
export function X402WhitelistStatus({ userAddress }: { userAddress?: string }) {
  const { isWhitelisted, isLoading, error } = useWhitelistStatus(userAddress);
  
  if (!userAddress) return null;
  
  if (isLoading) {
    return (
      <div className="text-sm text-gray-400">Checking whitelist status...</div>
    );
  }
  
  if (error) {
    return (
      <div className="text-sm text-red-400">Error checking status</div>
    );
  }
  
  return (
    <div className={`text-sm ${isWhitelisted ? "text-green-400" : "text-gray-400"}`}>
      {isWhitelisted ? (
        <>✨ You have free MegaMind minting (gas only)!</>
      ) : (
        <>💰 MegaMind minting costs $0.05 each</>
      )}
    </div>
  );
}
