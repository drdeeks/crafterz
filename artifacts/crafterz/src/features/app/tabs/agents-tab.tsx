import { useEffect, useState } from 'react';
import type { AgentDefinition } from '../hooks/use-agents';

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return `${h}h`;
  const m = Math.floor(ms / 60000);
  return `${m}m`;
}

function countdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export function AgentsTab({
  agents,
  loading,
  renting,
  craftz,
  onMount,
  onRent,
}: {
  agents: AgentDefinition[];
  loading: boolean;
  renting: string | null;
  craftz: number;
  onMount: () => void;
  onRent: (agentId: string, costCraftz: number) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState<{ agentId: string; message: string } | null>(null);

  useEffect(() => {
    onMount();
  }, [onMount]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(t);
  }, [feedback]);

  async function handleRent(agent: AgentDefinition) {
    if (craftz < agent.costCraftz) {
      setFeedback({ agentId: agent.id, message: `Need ${agent.costCraftz} Craftz` });
      return;
    }
    await onRent(agent.id, agent.costCraftz);
    setFeedback({ agentId: agent.id, message: agent.isRentedByMe ? 'Already active!' : `${agent.name} activated!` });
  }

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 mb-1">
        <p className="text-xs font-bold text-amber-400 mb-0.5">🧠 Brain Rental Marketplace</p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Hire specialist agents to amplify your crafting. Agent micro-payments settle autonomously via x402 — no wallet popup needed.
        </p>
      </div>

      {agents.map((agent) => {
        const isRented = agent.isRentedByMe && agent.myRental;
        const canAfford = craftz >= agent.costCraftz;
        const isThisRenting = renting === agent.id;
        const feedbackMatch = feedback?.agentId === agent.id;

        return (
          <div
            key={agent.id}
            className={`rounded-xl border p-4 flex items-start gap-4 transition-colors ${isRented ? 'bg-amber-950/20 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <div className="flex-shrink-0 text-4xl leading-none pt-0.5">{agent.portrait}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-bold text-sm">{agent.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">{agent.archetype}</span>
                {isRented && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">● ACTIVE</span>}
              </div>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{agent.description}</p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-semibold">{agent.buffDescription}</span>
              </div>
              {isRented && agent.myRental && (
                <p className="text-amber-400 text-xs mt-2 font-semibold">⏱ {countdown(agent.myRental.expiresAt)}</p>
              )}
              {feedbackMatch && (
                <p className="text-emerald-400 text-xs mt-1.5 font-semibold animate-pulse">{feedback.message}</p>
              )}
            </div>

            <div className="flex-shrink-0 text-right flex flex-col items-end gap-1.5">
              <div>
                <p className="text-amber-400 font-bold text-sm">{agent.costCraftz} ⚡</p>
                <p className="text-zinc-600 text-[10px]">{formatDuration(agent.durationMs)}</p>
              </div>
              {isRented ? (
                <button
                  disabled
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700 font-semibold cursor-default"
                >
                  Active
                </button>
              ) : (
                <button
                  onClick={() => void handleRent(agent)}
                  disabled={isThisRenting || !canAfford}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-colors ${canAfford ? 'bg-amber-400 text-zinc-900 hover:bg-amber-300' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'}`}
                >
                  {isThisRenting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      Hiring…
                    </span>
                  ) : canAfford ? 'Hire' : 'Low ⚡'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-3 mt-2">
        <p className="text-[10px] text-zinc-600 leading-relaxed text-center">
          ⚡ x402 payments settle peer-to-peer between agents — no gas fees, no wallet confirmation required per transaction.
        </p>
      </div>
      <div className="pb-4" />
    </div>
  );
}
