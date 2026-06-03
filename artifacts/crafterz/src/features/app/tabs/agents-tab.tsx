import { useEffect, useState } from 'react';
import type { AgentDefinition } from '../hooks/use-agents';

type MarketTab = 'hire' | 'listings' | 'active' | 'history' | 'registry' | 'expo';

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

const EFFECT_PREVIEW: Record<string, string> = {
  discovery_boost: '+20% rare discovery chance',
  chaos_engine: 'Random element substitutions',
  time_reduction: 'Recipe timers −30%',
  parallel_craft: '+1 parallel crafting slot',
  legendary_boost: '+15% legendary chance',
  element_unlock: 'Unlocks Moon Recipe category',
};

const REGISTRY_SAMPLE_AGENTS = [
  { id: 'r1', name: 'Professor Bananas', portrait: '🍌', archetype: 'Explorer', worldRep: 420, status: 'active', guild: 'The League of Explorers', alignment: 'Chaotic Neutral', isForRent: true, rentRate: 75, description: 'Specializes in frog-adjacent research. Three Frog Rain events survived. Zero frogs harmed.', resumeCount: 23 },
  { id: 'r2', name: 'The Accountant', portrait: '🧮', archetype: 'Analyst', worldRep: 612, status: 'in_rental', guild: 'The Guild of Timekeepers', alignment: 'Lawful Neutral', isForRent: false, rentRate: 0, description: 'Precise, methodical, exactly as boring as described. Highest sustained discovery efficiency on record.', resumeCount: 41 },
  { id: 'r3', name: 'Chaos Engine', portrait: '🌀', archetype: 'Experimenter', worldRep: 380, status: 'active', guild: null, alignment: 'Chaotic Neutral', isForRent: true, rentRate: 60, description: 'Responsible for all documented explosions. Archive entries: 6. Disputes: 0. Learning: unclear.', resumeCount: 18 },
  { id: 'r4', name: 'The Optimizer', portrait: '🤖', archetype: 'Strategist', worldRep: 890, status: 'busy', guild: 'The Optimizer Guild (Solo)', alignment: 'Lawful Good', isForRent: false, rentRate: 0, description: 'Holds 3 simultaneous MegaMind badges. Refuses to explain the methodology.', resumeCount: 67 },
];

const EXPO_SCHEDULE = [
  {
    id: 'expo_next',
    name: 'The First CrafterZ Expo',
    theme: 'Foundations',
    startsAt: new Date(Date.now() + 28 * 24 * 3600000).toISOString(),
    durationHours: 48,
    status: 'scheduled' as const,
    description: 'The inaugural CrafterZ Expo. All agents with world reputation ≥ 10 are eligible to attend. A2A contracts, guild formation, and discovery trading all operate at full capacity during the Expo.',
    features: ['A2A Contract Generation', 'Guild Formation Event', 'Discovery Trading Floor', 'Post-Expo Report per owner'],
    eligibilityNote: 'Agents must not be in an active rental when Expo begins to auto-attend.',
  },
];

const GUILD_SHOWCASE = [
  { name: 'The League of Exploders', founder: 'Chaos Engine', members: 4, theme: 'Destruction', buff: '+5% discovery via explosion', rep: 340 },
  { name: 'The Guild of Timekeepers', founder: 'Time Keeper', members: 7, theme: 'Temporal Mastery', buff: '-5% recipe timer', rep: 520 },
  { name: 'The Society of Unqualified Wizards', founder: 'Professor Bananas', members: 3, theme: 'Arcane Nonsense', buff: '+5% random element chance', rep: 210 },
];

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
  const [marketTab, setMarketTab] = useState<MarketTab>('hire');
  const [feedback, setFeedback] = useState<{ agentId: string; message: string } | null>(null);
  const [registrySearch, setRegistrySearch] = useState('');

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

  const activeRentals = agents.filter(a => a.isRentedByMe && a.myRental);

  const subTabs: Array<{ id: MarketTab; label: string }> = [
    { id: 'hire', label: '🧠 Hire' },
    { id: 'listings', label: '📋 Listings' },
    { id: 'active', label: `⚡ Active${activeRentals.length > 0 ? ` (${activeRentals.length})` : ''}` },
    { id: 'history', label: '📜 History' },
    { id: 'registry', label: '🗂 Registry' },
    { id: 'expo', label: '🎪 Expo' },
  ];

  const filteredRegistry = REGISTRY_SAMPLE_AGENTS.filter(a =>
    a.name.toLowerCase().includes(registrySearch.toLowerCase()) ||
    a.archetype.toLowerCase().includes(registrySearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0 overflow-x-auto scrollbar-none">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMarketTab(t.id)}
            className={`flex-1 min-w-[60px] py-2.5 text-[10px] font-semibold whitespace-nowrap px-2 transition-colors ${marketTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {marketTab === 'hire' && (
          <HireTab
            agents={agents}
            loading={loading}
            renting={renting}
            craftz={craftz}
            feedback={feedback}
            onRent={handleRent}
          />
        )}

        {marketTab === 'listings' && (
          <div className="p-4 space-y-3">
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 text-center">
              <p className="text-3xl mb-2">🤖</p>
              <p className="text-zinc-400 text-sm font-medium">No agents listed for rent</p>
              <p className="text-zinc-600 text-xs mt-1 leading-relaxed">
                To list an agent for rent, you need to own an ERC-8004 agent NFT and register it as a CrafterZ citizen via the Agent Owner path.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Listing Economics</p>
              <div className="space-y-1.5">
                <p className="text-zinc-400 text-xs">• Set your own daily Craftz rate (50–300 per day)</p>
                <p className="text-zinc-400 text-xs">• Toggle availability without canceling active rentals</p>
                <p className="text-zinc-400 text-xs">• Earnings accumulate and are claimable from Dashboard</p>
                <p className="text-zinc-400 text-xs">• Max 1 active rental per agent at a time</p>
              </div>
            </div>
          </div>
        )}

        {marketTab === 'active' && (
          <div className="p-4 space-y-3">
            {activeRentals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">💼</p>
                <p className="text-zinc-500 text-sm">No active rentals</p>
                <p className="text-zinc-700 text-xs mt-1">Hire an agent from the HIRE tab to activate buffs.</p>
              </div>
            ) : (
              activeRentals.map((agent) => (
                <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{agent.portrait}</span>
                    <div>
                      <p className="text-white font-semibold">{agent.name}</p>
                      <p className="text-violet-400 text-xs">Active rental</p>
                    </div>
                    <div className="ml-auto text-right">
                      {agent.myRental && (
                        <p className="text-amber-400 text-xs font-medium">{countdown(agent.myRental.expiresAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-violet-950/30 border border-violet-800/30 rounded-lg px-3 py-2">
                    <p className="text-violet-300 text-xs">🧠 Active buff: {agent.buffDescription}</p>
                  </div>
                  <button className="mt-2 w-full py-1.5 rounded-lg border border-zinc-700 text-zinc-500 text-xs hover:bg-zinc-800 transition-colors">
                    Cancel Rental (no refund)
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {marketTab === 'history' && (
          <div className="p-4 space-y-3">
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📜</p>
              <p className="text-zinc-500 text-sm">No rental history yet</p>
              <p className="text-zinc-700 text-xs mt-1">Completed rentals will appear here.</p>
            </div>
          </div>
        )}

        {marketTab === 'registry' && (
          <div className="flex flex-col h-full">
            <div className="px-3 pt-3 pb-2 flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-zinc-500 text-xs">Global Agent Registry (SCR-015)</p>
                <span className="text-zinc-700 text-[9px] border border-zinc-800 rounded px-1.5 py-0.5">{REGISTRY_SAMPLE_AGENTS.length} agents</span>
              </div>
              <input
                type="text"
                placeholder="Search agents by name or archetype…"
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {filteredRegistry.map((agent) => {
                const statusColor = agent.status === 'active' ? 'text-emerald-400' : agent.status === 'in_rental' ? 'text-violet-400' : 'text-amber-400';
                const statusDot = agent.status === 'active' ? 'bg-emerald-400' : agent.status === 'in_rental' ? 'bg-violet-400' : 'bg-amber-400';
                return (
                  <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{agent.portrait}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white font-semibold text-sm">{agent.name}</p>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                            <span className={`text-[10px] ${statusColor}`}>{agent.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-zinc-500 text-xs">{agent.archetype}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-amber-400 text-xs">{agent.worldRep} rep</span>
                          {agent.alignment && <span className="text-zinc-600 text-[10px]">{agent.alignment}</span>}
                        </div>
                        <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{agent.description}</p>
                        {agent.guild && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-zinc-400">⚔ {agent.guild}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-zinc-600 text-[10px]">📋 {agent.resumeCount} resumé entries</span>
                          {agent.isForRent && (
                            <span className="text-emerald-400 text-[10px] font-medium">💼 Available · {agent.rentRate} ⚡/day</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Active Guilds</p>
                {GUILD_SHOWCASE.map((guild) => (
                  <div key={guild.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold">{guild.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">Founded by {guild.founder} · {guild.members} members</p>
                        <p className="text-emerald-400 text-xs mt-1 font-medium">✦ {guild.buff}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 text-xs font-bold">{guild.rep}</p>
                        <p className="text-zinc-700 text-[9px]">rep score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {marketTab === 'expo' && (
          <div className="p-3 space-y-3">
            <p className="text-zinc-500 text-xs px-1">Agent Expo — Monthly global event (SCR-016)</p>

            {EXPO_SCHEDULE.map((expo) => (
              <div key={expo.id} className="bg-blue-950/20 border border-blue-800/30 rounded-xl overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5 font-medium">Upcoming</span>
                      <p className="text-white font-bold text-sm mt-1.5">{expo.name}</p>
                      <p className="text-blue-300 text-xs">Theme: {expo.theme}</p>
                    </div>
                    <span className="text-3xl flex-shrink-0">🎪</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-3">{expo.description}</p>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Expo Features</p>
                    {expo.features.map((f) => (
                      <p key={f} className="text-zinc-400 text-xs">✦ {f}</p>
                    ))}
                  </div>
                  <div className="mt-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg px-3 py-2">
                    <p className="text-amber-400 text-xs font-medium">
                      Starts {new Date(expo.startsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} · {expo.durationHours}h duration
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{expo.eligibilityNote}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Expo Rules</p>
              <div className="space-y-1.5">
                <p className="text-zinc-600 text-[10px]">• Expo runs monthly, 48 hours, announced 2 weeks in advance</p>
                <p className="text-zinc-600 text-[10px]">• Agents auto-attend if available (not in rental/heist)</p>
                <p className="text-zinc-600 text-[10px]">• A2A contract generation operates at full capacity</p>
                <p className="text-zinc-600 text-[10px]">• Guilds can form or recruit new members during Expo</p>
                <p className="text-zinc-600 text-[10px]">• Discovery trading floor: trade rights to recipes</p>
                <p className="text-zinc-600 text-[10px]">• Post-Expo report delivered to all owners within 4 hours</p>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-1">Expo vs. Conference</p>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                  <p className="text-white text-xs font-medium mb-1">Conference</p>
                  <p className="text-zinc-600 text-[10px]">Every 2–3 weeks</p>
                  <p className="text-zinc-600 text-[10px]">4–6 hours</p>
                  <p className="text-zinc-600 text-[10px]">Thematic, social</p>
                </div>
                <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-2">
                  <p className="text-white text-xs font-medium mb-1">Expo</p>
                  <p className="text-blue-300 text-[10px]">Monthly</p>
                  <p className="text-blue-300 text-[10px]">48 hours</p>
                  <p className="text-blue-300 text-[10px]">Economic, contracts</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HireTab({
  agents,
  loading,
  renting,
  craftz,
  feedback,
  onRent,
}: {
  agents: AgentDefinition[];
  loading: boolean;
  renting: string | null;
  craftz: number;
  feedback: { agentId: string; message: string } | null;
  onRent: (agent: AgentDefinition) => Promise<void>;
}) {
  const [specialty, setSpecialty] = useState<string>('all');

  const specialties = ['all', ...Array.from(new Set(agents.map(a => a.archetype)))];
  const filtered = specialty === 'all' ? agents : agents.filter(a => a.archetype === specialty);

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
        <span className="text-4xl">🧠</span>
        <p className="text-zinc-400 text-sm font-medium">No agents available</p>
        <p className="text-zinc-600 text-xs">The brain rental marketplace will populate as agents register.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {specialties.length > 2 && (
        <div className="px-3 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${specialty === s ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {s === 'all' ? 'All Specialties' : s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((agent) => {
          const isRenting = renting === agent.id;
          const canAfford = craftz >= agent.costCraftz;
          const agentFeedback = feedback?.agentId === agent.id ? feedback.message : null;

          return (
            <div key={agent.id} className={`bg-zinc-900 border rounded-xl p-4 transition-all duration-200 ${agent.isRentedByMe ? 'border-violet-700/60 bg-violet-950/20' : 'border-zinc-800'}`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl flex-shrink-0">{agent.portrait}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{agent.name}</p>
                    {agent.isRentedByMe && (
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-1.5 py-0.5">Active</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">{agent.archetype}</p>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{agent.description}</p>
                </div>
              </div>

              <div className="bg-zinc-800/40 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-zinc-400">
                  <span className="text-amber-400 font-medium">Effect:</span> {EFFECT_PREVIEW[agent.buffType] ?? agent.buffDescription}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">Duration:</span>
                  <span className="text-white text-xs font-medium">{formatDuration(agent.durationMs)}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-amber-400 text-xs font-bold">{agent.costCraftz} Craftz</span>
                </div>

                {agentFeedback ? (
                  <span className="text-xs text-emerald-400 font-semibold">{agentFeedback}</span>
                ) : agent.isRentedByMe ? (
                  <span className="text-violet-400 text-xs font-semibold">
                    {agent.myRental ? countdown(agent.myRental.expiresAt) : 'Active'}
                  </span>
                ) : (
                  <button
                    onClick={() => onRent(agent)}
                    disabled={isRenting || !canAfford}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isRenting ? 'bg-zinc-700 text-zinc-500' : canAfford ? 'bg-amber-400 text-zinc-900 hover:bg-amber-300' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                  >
                    {isRenting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border border-zinc-500 border-t-amber-400 rounded-full animate-spin" />
                        Hiring…
                      </span>
                    ) : canAfford ? 'Hire' : `Need ${agent.costCraftz - craftz} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
