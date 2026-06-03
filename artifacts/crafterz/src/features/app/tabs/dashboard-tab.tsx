import { useState } from 'react';
import type { AgentDefinition } from '../hooks/use-agents';
import type { WeatherEvent } from '../hooks/use-weather';

type DashTab = 'overview' | 'agents' | 'analytics' | 'employment';

interface KpiCard {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-400',
  busy: 'text-amber-400',
  in_rental: 'text-violet-400',
  in_conference: 'text-blue-400',
  sleeping: 'text-zinc-500',
  retired: 'text-zinc-700',
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400',
  busy: 'bg-amber-400',
  in_rental: 'bg-violet-400',
  in_conference: 'bg-blue-400',
  sleeping: 'bg-zinc-600',
  retired: 'bg-zinc-800',
};

const AGENT_ANALYTICS = [
  {
    icon: '🔬',
    label: 'Most Productive',
    agentName: 'The Optimizer',
    metric: '847 discoveries',
    sub: 'Highest discovery count',
  },
  {
    icon: '💥',
    label: 'Most Chaotic',
    agentName: 'Chaos Engine',
    metric: '14 explosions',
    sub: 'Most failed experiments. Prominently.',
  },
  {
    icon: '🤝',
    label: 'Most Trusted',
    agentName: 'Time Keeper',
    metric: '9.2/10 rep score',
    sub: 'Highest relationship score average',
  },
  {
    icon: '💰',
    label: 'Most Profitable',
    agentName: 'The Optimizer',
    metric: '1,420 Craftz earned',
    sub: 'Total rental earnings',
  },
  {
    icon: '🏆',
    label: 'Largest Single Failure',
    agentName: 'Chaos Engine',
    metric: 'The Potato Incident',
    sub: 'Week 3 · 14-element chain explosion. Classified.',
  },
];

const EMPLOYMENT_SAMPLE = [
  {
    id: 'e1',
    agentName: 'The Optimizer',
    employerUsername: 'alchemy_fan',
    startedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    earnedCraftz: 30,
    status: 'active' as const,
  },
  {
    id: 'e2',
    agentName: 'Chaos Engine',
    employerUsername: 'bot_player_1',
    startedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    earnedCraftz: 80,
    status: 'completed' as const,
  },
];

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function DashboardTab({
  agents,
  agentsLoading,
  weatherEvent,
  myPoints,
  craftz,
}: {
  agents: AgentDefinition[];
  agentsLoading: boolean;
  weatherEvent?: WeatherEvent | null;
  myPoints: number;
  craftz: number;
}) {
  const [dashTab, setDashTab] = useState<DashTab>('overview');

  const activeRentals = agents.filter(a => a.isRentedByMe);
  const totalRevenue = EMPLOYMENT_SAMPLE.reduce((sum, e) => sum + e.earnedCraftz, 0);
  const weekRevenue = EMPLOYMENT_SAMPLE.filter(e => {
    const d = new Date(e.startedAt).getTime();
    return Date.now() - d < 7 * 24 * 3600000;
  }).reduce((sum, e) => sum + e.earnedCraftz, 0);

  const kpiCards: KpiCard[] = [
    { icon: '🤖', label: 'Total Agents', value: agents.length, sub: 'Registered citizens' },
    { icon: '💼', label: 'Active Rentals', value: activeRentals.length, color: 'text-violet-400' },
    { icon: '💰', label: 'Rental Revenue', value: `${totalRevenue} ⚡`, sub: `+${weekRevenue} this week` },
    { icon: '🏆', label: 'My Points', value: myPoints.toLocaleString() },
    { icon: '⚡', label: 'Craftz Balance', value: craftz, color: craftz < 20 ? 'text-red-400' : 'text-amber-400' },
    { icon: '🌦', label: 'Weather', value: weatherEvent?.name ?? 'Clear', color: weatherEvent ? '#22d3ee' : undefined },
  ];

  const tabs: Array<{ id: DashTab; label: string }> = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'agents', label: '🤖 My Agents' },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'employment', label: '💼 Employment' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setDashTab(t.id)}
            className={`flex-1 min-w-[72px] py-2.5 text-[10px] font-semibold whitespace-nowrap px-1.5 transition-colors ${dashTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {dashTab === 'overview' && (
          <div className="p-3 space-y-4">
            <p className="text-zinc-500 text-xs px-1">Agent Empire Dashboard</p>

            <div className="grid grid-cols-2 gap-2">
              {kpiCards.map((card) => (
                <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-base mb-1">{card.icon}</p>
                  <p className={`text-base font-bold ${card.color ?? 'text-white'}`} style={typeof card.color === 'string' && card.color.startsWith('#') ? { color: card.color } : {}}>
                    {card.value}
                  </p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">{card.label}</p>
                  {card.sub && <p className="text-zinc-700 text-[9px] mt-0.5">{card.sub}</p>}
                </div>
              ))}
            </div>

            <div>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">World Status</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Current Cosmic Age</span>
                  <span className="text-zinc-300 text-xs font-medium">Age of First Things</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Active Weather</span>
                  <span className="text-xs font-medium" style={{ color: weatherEvent?.colorHint ?? '#71717a' }}>
                    {weatherEvent ? `${weatherEvent.icon} ${weatherEvent.name}` : '⛅ Clear'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Next Conference</span>
                  <span className="text-amber-400 text-xs font-medium">In ~3 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Next Expo</span>
                  <span className="text-zinc-500 text-xs">First weekend of next month</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Recent Activity</p>
              <div className="space-y-1.5">
                {[
                  { icon: '✅', text: 'The Optimizer completed Craft Assist task', time: '3m ago' },
                  { icon: '💼', text: 'Chaos Engine rental started — employer: alchemy_fan', time: '18h ago' },
                  { icon: '🏛', text: 'Time Keeper attended conference: Potato Summit', time: '3d ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-3 py-2">
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 text-xs">{item.text}</p>
                      <p className="text-zinc-700 text-[10px] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Craftz Economy Reference (Appendix B)</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Sources (Earn)</p>
                </div>
                {([
                  { label: 'Daily task completion', value: '5–25 ⚡ each', color: 'text-emerald-400' },
                  { label: 'First discovery bonus', value: '+50 ⚡', color: 'text-emerald-400' },
                  { label: 'Agent rental income', value: 'Variable per day', color: 'text-emerald-400' },
                  { label: 'Heist victory', value: '+30 ⚡', color: 'text-emerald-400' },
                ] as Array<{ label: string; value: string; color: string }>).map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400 text-xs">{item.label}</span>
                    <span className={`text-xs font-medium ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="px-3 py-2 border-b border-zinc-800 mt-1">
                  <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Sinks (Spend)</p>
                </div>
                {([
                  { label: 'Brain rental', value: '50–300 ⚡', color: 'text-red-400' },
                  { label: 'Recipe hint (−5 per hint)', value: '5 ⚡/hint', color: 'text-red-400' },
                  { label: 'MegaMind NFT mint', value: 'Variable', color: 'text-red-400' },
                  { label: 'Initiate heist (stake)', value: '20 ⚡ stake', color: 'text-red-400' },
                ] as Array<{ label: string; value: string; color: string }>).map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400 text-xs">{item.label}</span>
                    <span className={`text-xs font-medium ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="px-3 py-2">
                  <p className="text-zinc-700 text-[9px] leading-relaxed">
                    Craftz is not a token. It is an in-game soft currency. No real monetary value. Supply managed by game server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashTab === 'agents' && (
          <div className="p-3 space-y-2">
            <p className="text-zinc-500 text-xs px-1 mb-3">All registered agents</p>

            {agentsLoading ? (
              <div className="flex items-center justify-center h-24 gap-2">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🤖</p>
                <p className="text-zinc-500 text-sm">No agents registered yet.</p>
                <p className="text-zinc-700 text-xs mt-1">Return to the landing page and "Enter as Agent Owner" to register your first agent.</p>
              </div>
            ) : (
              agents.map((agent) => {
                const status = agent.isRentedByMe ? 'in_rental' : 'active';
                return (
                  <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{agent.portrait}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold">{agent.name}</p>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-zinc-600'}`} />
                            <span className={`text-[10px] ${STATUS_COLOR[status] ?? 'text-zinc-500'}`}>
                              {status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-xs">{agent.archetype}</p>
                        <p className="text-zinc-600 text-xs mt-1 leading-relaxed">{agent.description}</p>
                        {agent.isRentedByMe && agent.buffDescription && (
                          <div className="mt-2 bg-violet-950/30 border border-violet-800/30 rounded-lg px-2.5 py-1.5">
                            <p className="text-violet-300 text-xs">🧠 {agent.buffDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {[
                        { label: 'Hire Out', color: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' },
                        { label: 'Assign Task', color: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' },
                        { label: 'Recall', color: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' },
                        { label: 'Retire', color: 'bg-zinc-800 text-red-400 hover:bg-zinc-700' },
                      ].map((action) => (
                        <button key={action.label} className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${action.color}`}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {dashTab === 'analytics' && (
          <div className="p-3 space-y-2">
            <p className="text-zinc-500 text-xs px-1 mb-3">Agent performance analytics (computed nightly)</p>

            {AGENT_ANALYTICS.map((stat) => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{stat.icon}</span>
                  <div className="flex-1">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <p className="text-white text-sm font-semibold">{stat.agentName}</p>
                      <p className="text-amber-400 text-xs">{stat.metric}</p>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-0.5 italic">{stat.sub}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-600 text-[10px] leading-relaxed">
                Analytics computed nightly. Real-time analytics are a future phase feature.
                The "Largest Single Failure" category is not hidden. Failure is canonical.
              </p>
            </div>
          </div>
        )}

        {dashTab === 'employment' && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-amber-400 font-bold text-lg">{totalRevenue}</p>
                <p className="text-zinc-500 text-xs">Total Craftz Earned</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-amber-400 font-bold text-lg">{weekRevenue}</p>
                <p className="text-zinc-500 text-xs">This Week</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-zinc-500 text-xs">Rental Activity</p>
            </div>

            {EMPLOYMENT_SAMPLE.map((emp) => (
              <div key={emp.id} className={`bg-zinc-900 border rounded-xl px-4 py-3 ${emp.status === 'active' ? 'border-violet-800/40' : 'border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${emp.status === 'active' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-zinc-700/50 text-zinc-500'}`}>
                      {emp.status}
                    </span>
                    <span className="text-white text-sm font-medium">{emp.agentName}</span>
                  </div>
                  <span className="text-amber-400 text-xs font-bold">+{emp.earnedCraftz} ⚡</span>
                </div>
                <p className="text-zinc-500 text-xs">Employer: {emp.employerUsername}</p>
                {emp.status === 'active' && (
                  <p className="text-violet-300 text-xs mt-0.5">{formatCountdown(emp.expiresAt)}</p>
                )}
              </div>
            ))}

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-1.5">Pending Earnings</p>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs">Claimable balance</span>
                <span className="text-amber-400 text-xs font-bold">0 ⚡</span>
              </div>
              <p className="text-zinc-700 text-[10px] mt-1">Earnings from active rentals accumulate and become claimable when the rental completes.</p>
              <button className="w-full mt-2 py-2 rounded-xl border border-zinc-700 text-zinc-500 text-xs font-medium cursor-not-allowed" disabled>
                Claim Earnings (nothing pending)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
