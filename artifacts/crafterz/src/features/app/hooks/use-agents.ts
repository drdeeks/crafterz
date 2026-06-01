import { useState, useCallback } from 'react';

export interface AgentRental {
  id: string;
  agentId: string;
  startedAt: string;
  expiresAt: string;
  costCraftz: number;
  isActive: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  portrait: string;
  archetype: string;
  description: string;
  buffType: string;
  buffValue: number;
  buffDescription: string;
  costCraftz: number;
  durationMs: number;
  isRentedByMe: boolean;
  myRental: AgentRental | null;
}

export interface UseAgentsReturn {
  agents: AgentDefinition[];
  loading: boolean;
  renting: string | null;
  fetchAgents: (fid?: number) => Promise<void>;
  rentAgent: (agentId: string, fid: number, paymentMethod?: 'craftz' | 'x402') => Promise<{ ok: boolean; buffApplied?: string; error?: string }>;
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [renting, setRenting] = useState<string | null>(null);

  const fetchAgents = useCallback(async (fid = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents?fid=${fid}`);
      if (!res.ok) return;
      const data = await res.json() as { ok: boolean; agents?: AgentDefinition[] };
      if (data.ok && data.agents) setAgents(data.agents);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const rentAgent = useCallback(async (agentId: string, fid: number, paymentMethod: 'craftz' | 'x402' = 'craftz') => {
    setRenting(agentId);
    try {
      const res = await fetch(`/api/agents/${agentId}/rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, paymentMethod }),
      });
      const data = await res.json() as { ok: boolean; buffApplied?: string; error?: string; rental?: AgentRental };
      if (data.ok) {
        setAgents((prev) => prev.map((a) =>
          a.id === agentId ? { ...a, isRentedByMe: true, myRental: data.rental ?? null } : a
        ));
      }
      return data;
    } catch {
      return { ok: false, error: 'Network error' };
    } finally {
      setRenting(null);
    }
  }, []);

  return { agents, loading, renting, fetchAgents, rentAgent };
}
