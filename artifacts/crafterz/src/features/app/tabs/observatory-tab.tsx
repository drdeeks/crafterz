import { useState } from 'react';
import type { AgentDefinition } from '../hooks/use-agents';
import type { WeatherEvent } from '../hooks/use-weather';

type ObsSubTab = 'activity' | 'relationships' | 'status' | 'weather' | 'conference';

const TYPE_COLOR: Record<string, string> = {
  discovery: 'text-amber-400',
  rental: 'text-violet-400',
  heist: 'text-red-400',
  conference: 'text-blue-400',
  relationship: 'text-pink-400',
  task: 'text-emerald-400',
  weather: 'text-cyan-400',
};

const TYPE_ICON: Record<string, string> = {
  discovery: '🔬',
  rental: '💼',
  heist: '⚔️',
  conference: '🏛',
  relationship: '🤝',
  task: '✅',
  weather: '🌦',
};

interface ObservatoryEvent {
  id: string;
  agentName: string;
  action: string;
  detail: string;
  timestamp: string;
  type: keyof typeof TYPE_ICON;
}

interface Relationship {
  agentA: string;
  agentB: string;
  label: string;
  strength: number;
}

const SAMPLE_RELATIONSHIPS: Relationship[] = [
  { agentA: 'The Optimizer', agentB: 'Chaos Engine', label: 'Rivals', strength: 3 },
  { agentA: 'Time Keeper', agentB: 'The Optimizer', label: 'Colleagues', strength: 7 },
  { agentA: 'The Archivist', agentB: 'Time Keeper', label: 'Research Partners', strength: 5 },
  { agentA: 'Chaos Engine', agentB: 'The Archivist', label: 'Accomplices', strength: 2 },
];

const CONFERENCE_SCHEDULE = [
  { id: 'c1', name: '5th Annual Conference on Extremely Dangerous Potatoes', date: 'Upcoming', status: 'scheduled' as const, agents: 0, countdown: 'In ~3 days' },
  { id: 'c2', name: 'Emergency Summit on Frog-Adjacent Elements', date: 'Week 6', status: 'completed' as const, agents: 22, outcome: 'Three new guilds formed. No frogs were harmed.' },
  { id: 'c3', name: 'Quarterly Review: Explosive Crafting Safety', date: 'Week 4', status: 'completed' as const, agents: 15, outcome: 'Chaos Engine presented findings. Conference evacuated twice. Both times considered successful.' },
];

const WEATHER_HISTORY = [
  { icon: '🐸', name: 'Frog Rain', effect: '+25% frog-element discovery rate', duration: '2 hours', occurred: '3 days ago', intensity: 'High' },
  { icon: '🔥', name: 'Solar Flare', effect: 'Fire elements x2 combination power', duration: '4 hours', occurred: '6 days ago', intensity: 'Extreme' },
  { icon: '❄️', name: 'Frost Event', effect: 'Water combinations gain bonus tier chance', duration: '1.5 hours', occurred: '9 days ago', intensity: 'Moderate' },
  { icon: '💨', name: 'Chaos Storm', effect: 'All element combinations randomized 20%', duration: '30 minutes', occurred: '11 days ago', intensity: 'Critical' },
];

function generateObservatoryEvents(agents: AgentDefinition[]): ObservatoryEvent[] {
  if (agents.length === 0) return [];
  const a0 = agents[0]?.name ?? 'The Optimizer';
  const a1 = agents[1]?.name ?? 'Chaos Engine';
  const a2 = agents[2]?.name ?? 'Time Keeper';

  return [
    {
      id: 'ev1', agentName: a0, action: 'completed a Craft Assist task',
      detail: 'Discovery rate improved by 15% for contracted player.',
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(), type: 'task',
    },
    {
      id: 'ev2', agentName: a1, action: 'survived a weather event',
      detail: 'Emerged from the Frog Rain with 3 new experimental notes.',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(), type: 'weather',
    },
    {
      id: 'ev3', agentName: a0, action: 'formed an Acquaintance relationship',
      detail: 'Brief interaction recorded. Interaction counter: 1.',
      timestamp: new Date(Date.now() - 28 * 60000).toISOString(), type: 'relationship',
    },
    {
      id: 'ev4', agentName: a2, action: 'attended a conference',
      detail: '4th Annual Conference on Extremely Dangerous Potatoes. Agent participated without incident.',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), type: 'conference',
    },
    {
      id: 'ev5', agentName: a1, action: 'rental completed',
      detail: 'Employer satisfied. +2 world reputation earned.',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), type: 'rental',
    },
  ];
}

function formatTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function ObservatoryTab({
  agents,
  agentsLoading,
  weatherEvent,
  weatherSecondsRemaining,
}: {
  agents: AgentDefinition[];
  agentsLoading: boolean;
  weatherEvent?: WeatherEvent | null;
  weatherSecondsRemaining?: number;
}) {
  const [subTab, setSubTab] = useState<ObsSubTab>('activity');
  const events = generateObservatoryEvents(agents);

  const tabs: Array<{ id: ObsSubTab; label: string }> = [
    { id: 'activity', label: '📡 Activity' },
    { id: 'relationships', label: '🕸 Graph' },
    { id: 'status', label: '🟢 Status' },
    { id: 'weather', label: '🌦 Weather' },
    { id: 'conference', label: '🏛 Hall' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 min-w-[52px] py-2.5 text-[10px] font-semibold whitespace-nowrap px-1.5 transition-colors ${subTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {subTab === 'activity' && (
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <p className="text-zinc-500 text-xs">Real-time agent activity log</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-600 text-[10px]">Live</span>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🔭</p>
                <p className="text-zinc-500 text-sm">Observatory is quiet.</p>
                <p className="text-zinc-700 text-xs mt-1">Agent activity appears here as agents operate in the world.</p>
              </div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg flex-shrink-0">{TYPE_ICON[ev.type] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-xs font-semibold">{ev.agentName}</span>
                        <span className={`text-xs ${TYPE_COLOR[ev.type] ?? 'text-zinc-400'}`}>{ev.action}</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">{ev.detail}</p>
                      <p className="text-zinc-700 text-[10px] mt-1">{formatTimeAgo(ev.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {subTab === 'relationships' && (
          <div className="p-3 space-y-3">
            <p className="text-zinc-500 text-xs px-1">Inter-agent relationship graph</p>

            <div className="space-y-2">
              {SAMPLE_RELATIONSHIPS.map((r, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-medium whitespace-nowrap">{r.agentA}</span>
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <div className="flex-1 border-t border-zinc-700" />
                      <span className="text-[10px] text-zinc-500 px-1 whitespace-nowrap">{r.label}</span>
                      <div className="flex-1 border-t border-zinc-700" />
                    </div>
                    <span className="text-xs text-white font-medium whitespace-nowrap">{r.agentB}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div key={j} className={`w-2 h-2 rounded-sm ${j < r.strength ? 'bg-amber-400' : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                    <span className="text-zinc-600 text-[10px]">{r.strength}/10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Relationship Types</p>
              {[['Trusted Colleague', 'Long-term co-operation, 5+ interactions'], ['Accomplice', 'Participated in a heist together'], ['Rival', 'Competed in a heist, outcome contested'], ['Research Partner', 'Co-discovery via shared crafting session']].map(([label, desc]) => (
                <p key={label} className="text-zinc-600 text-[10px] mb-1"><span className="text-zinc-400 font-medium">{label}:</span> {desc}</p>
              ))}
            </div>
          </div>
        )}

        {subTab === 'status' && (
          <div className="p-3 space-y-2">
            <p className="text-zinc-500 text-xs px-1 mb-3">Current agent presence and world status</p>

            {agentsLoading ? (
              <div className="flex items-center justify-center h-24 gap-2">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
                <span className="text-zinc-600 text-xs">Loading agents…</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🤖</p>
                <p className="text-zinc-500 text-sm">No agents in registry yet.</p>
              </div>
            ) : (
              agents.map((agent) => {
                const statusLabel = agent.isRentedByMe ? 'In Rental' : 'Available';
                const statusColor = agent.isRentedByMe ? 'text-violet-400' : 'text-emerald-400';
                const statusDot = agent.isRentedByMe ? 'bg-violet-400' : 'bg-emerald-400';
                return (
                  <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{agent.portrait}</span>
                        <div>
                          <p className="text-white text-sm font-semibold">{agent.name}</p>
                          <p className="text-zinc-500 text-xs">{agent.archetype}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                        <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
                      </div>
                    </div>
                    {agent.isRentedByMe && agent.buffDescription && (
                      <div className="mt-2 bg-violet-950/30 border border-violet-800/30 rounded-lg px-2.5 py-1.5">
                        <p className="text-violet-300 text-xs">🧠 Active buff: {agent.buffDescription}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">World Status</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Active Agents</span>
                  <span className="text-white text-xs font-medium">{agents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Currently Rented</span>
                  <span className="text-violet-400 text-xs font-medium">{agents.filter(a => a.isRentedByMe).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Next Conference</span>
                  <span className="text-amber-400 text-xs font-medium">In ~3 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Current Age</span>
                  <span className="text-zinc-300 text-xs">Age of First Things</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'weather' && (
          <div className="p-3 space-y-3">
            {weatherEvent ? (
              <div className="bg-zinc-900 border rounded-xl p-4" style={{ borderColor: `${weatherEvent.colorHint}40` }}>
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{weatherEvent.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base">{weatherEvent.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{weatherEvent.description}</p>
                    {(weatherSecondsRemaining ?? 0) > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: weatherEvent.colorHint }} />
                        <span className="text-xs font-medium" style={{ color: weatherEvent.colorHint }}>
                          Active · {formatSeconds(weatherSecondsRemaining ?? 0)} remaining
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 bg-zinc-800/50 rounded-lg px-3 py-2">
                  <p className="text-zinc-400 text-xs font-medium mb-0.5">Effect</p>
                  <p className="text-zinc-300 text-xs">{weatherEvent.effectType} modifier: {weatherEvent.effectValue > 0 ? '+' : ''}{(weatherEvent.effectValue * 100).toFixed(0)}%</p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-3xl mb-2">⛅</p>
                <p className="text-zinc-400 text-sm font-medium">No active weather event</p>
                <p className="text-zinc-600 text-xs mt-1">Current conditions: Unusually Normal. This is considered unusual.</p>
              </div>
            )}

            <div>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Recent Weather History</p>
              <div className="space-y-1.5">
                {WEATHER_HISTORY.map((w) => (
                  <div key={w.name} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{w.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-xs font-semibold">{w.name}</p>
                        <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${w.intensity === 'Critical' ? 'bg-red-500/20 text-red-400' : w.intensity === 'Extreme' ? 'bg-orange-500/20 text-orange-400' : w.intensity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                          {w.intensity}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">{w.effect}</p>
                      <p className="text-zinc-700 text-[10px] mt-0.5">{w.duration} · {w.occurred}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Weather Rules</p>
              <div className="space-y-1">
                <p className="text-zinc-600 text-[10px]">• Events run for a maximum of 4 hours</p>
                <p className="text-zinc-600 text-[10px]">• Same event type cannot repeat within 48 hours</p>
                <p className="text-zinc-600 text-[10px]">• Effects apply globally and instantly on event start</p>
                <p className="text-zinc-600 text-[10px]">• In-progress crafts complete under pre-event conditions</p>
                <p className="text-zinc-600 text-[10px]">• Craft the Weather Globe item to influence minor events (1x/week)</p>
              </div>
            </div>
          </div>
        )}

        {subTab === 'conference' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-zinc-500 text-xs">Agent Conference Hall</p>
              <span className="text-[9px] text-zinc-700 border border-zinc-800 rounded px-1.5 py-0.5">Global Schedule</span>
            </div>

            {CONFERENCE_SCHEDULE.map((conf) => (
              <div key={conf.id} className={`border rounded-xl overflow-hidden ${conf.status === 'scheduled' ? 'bg-blue-950/20 border-blue-800/30' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {conf.status === 'scheduled' ? (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5 font-medium">Upcoming</span>
                        ) : (
                          <span className="text-[9px] bg-zinc-700/50 text-zinc-500 border border-zinc-600/30 rounded-full px-1.5 py-0.5">Completed</span>
                        )}
                        <span className="text-zinc-600 text-[10px]">{conf.date}</span>
                      </div>
                      <p className="text-white text-sm font-semibold leading-tight">{conf.name}</p>
                    </div>
                    <span className="text-2xl flex-shrink-0">🏛</span>
                  </div>

                  {conf.status === 'scheduled' && conf.countdown && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-blue-400 text-xs font-medium">{conf.countdown}</span>
                    </div>
                  )}

                  {conf.status === 'completed' && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-zinc-600 text-[10px]">Attendees:</span>
                        <span className="text-zinc-300 text-xs font-medium">{conf.agents} agents</span>
                      </div>
                      {conf.outcome && (
                        <div className="mt-2 bg-zinc-800/50 rounded-lg px-2.5 py-2">
                          <p className="text-zinc-400 text-[10px] leading-relaxed">{conf.outcome}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs font-semibold mb-2">Conference Rules</p>
              <div className="space-y-1.5">
                <p className="text-zinc-600 text-[10px]">• Conferences occur on a fixed global schedule (72h advance notice)</p>
                <p className="text-zinc-600 text-[10px]">• Players observe and optionally influence their agents</p>
                <p className="text-zinc-600 text-[10px]">• Max 3 nudges per conference, per agent (costs Craftz)</p>
                <p className="text-zinc-600 text-[10px]">• Max 1 intervention per conference, per agent (rare, costly)</p>
                <p className="text-zinc-600 text-[10px]">• All owners receive a post-conference summary report</p>
                <p className="text-zinc-600 text-[10px]">• Notable conference moments become Archive entries</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider px-1">A2A Contracts (Agent-to-Agent)</p>
              {[
                { id: 'a2a1', parties: ['The Optimizer', 'Chaos Engine'], type: 'Research Partnership', terms: 'Share discovery paths for fire-adjacent elements. No explosions clause (contested).', status: 'active', value: '10 Craftz/week' },
                { id: 'a2a2', parties: ['Time Keeper', 'The Archivist'], type: 'Documentation Agreement', terms: 'Archivist provides weekly summary. Time Keeper provides scheduling data.', status: 'completed', value: '5 Craftz total' },
                { id: 'a2a3', parties: ['Professor Bananas', 'Chaos Engine'], type: 'Joint Research', terms: 'Frog-adjacent and chaos element cross-study. Both parties insist the other initiated it.', status: 'pending', value: '20 Craftz/month' },
              ].map((contract) => (
                <div key={contract.id} className={`border rounded-xl p-3 ${contract.status === 'active' ? 'bg-emerald-950/10 border-emerald-700/30' : contract.status === 'pending' ? 'bg-amber-950/10 border-amber-700/30' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-white text-xs font-semibold">{contract.type}</p>
                      <p className="text-zinc-500 text-[10px]">{contract.parties.join(' ⟷ ')}</p>
                    </div>
                    <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium flex-shrink-0 ${contract.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : contract.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700/50 text-zinc-500'}`}>
                      {contract.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[10px] leading-relaxed">{contract.terms}</p>
                  <p className="text-amber-400 text-[10px] mt-1 font-medium">{contract.value}</p>
                </div>
              ))}
              <p className="text-zinc-700 text-[9px] px-1">A2A contracts are generated at conferences and Agent Expos. Full contract trading opens at the next Expo.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
