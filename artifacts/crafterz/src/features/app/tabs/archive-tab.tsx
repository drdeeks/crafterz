import { useState } from 'react';
import type { AppInventoryItem } from '../app-types';

type ArchiveSubTab = 'history' | 'legends' | 'encyclopedia' | 'records';

interface ArchiveEntry {
  id: string;
  title: string;
  eventType: 'discovery' | 'heist' | 'conference' | 'cosmic_age' | 'first_ever';
  eventDate: string;
  narrativeSummary: string;
  primaryAgents: string[];
  itemReferenced?: string;
}

interface EncyclopediaItem {
  name: string;
  emoji: string;
  tier: string;
  discoveryDate: string;
  discoverer: string;
  isMegaMind: boolean;
  recipe?: string;
}

interface AgentLegend {
  name: string;
  portrait: string;
  archiveAppearances: number;
  notableAchievement: string;
  status: 'Active' | 'Retired' | 'Busy';
  knownFor: string;
}

function buildEncyclopedia(inventory: AppInventoryItem[]): EncyclopediaItem[] {
  return inventory
    .filter(i => !['Fire', 'Water', 'Earth', 'Air', 'Light', 'Shadow', 'Chaos'].includes(i.name))
    .map(i => ({
      name: i.name,
      emoji: i.emoji,
      tier: i.tier,
      discoveryDate: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toLocaleDateString(),
      discoverer: 'you',
      isMegaMind: i.isMegaMind ?? false,
      recipe: i.recipe,
    }));
}

const SAMPLE_ARCHIVE_ENTRIES: ArchiveEntry[] = [
  {
    id: 'a1',
    title: 'The First Firing',
    eventType: 'first_ever',
    eventDate: 'Day 1',
    narrativeSummary: 'In the beginning, there was Fire, Water, Earth, Air, Light, Shadow, and Chaos. Seven elements from which all things would eventually emerge, most of them unexpectedly.',
    primaryAgents: ['The Optimizer'],
    itemReferenced: 'Fire',
  },
  {
    id: 'a2',
    title: '4th Annual Conference on Extremely Dangerous Potatoes',
    eventType: 'conference',
    eventDate: 'Week 2',
    narrativeSummary: 'Seventeen agents convened to discuss the ongoing potato situation. Three new research partnerships were formed. One agent emerged with what it described as "a plan." Details remain classified.',
    primaryAgents: ['The Optimizer', 'Chaos Engine', 'Time Keeper'],
  },
  {
    id: 'a3',
    title: 'The Great Frog Rain Incident',
    eventType: 'cosmic_age',
    eventDate: 'Week 3',
    narrativeSummary: 'The third Frog Rain event in 14 days triggered the Age of Amphibians. For 24 hours, frog-adjacent elements gained unique discovery paths. The frogs themselves remained indifferent.',
    primaryAgents: [],
  },
  {
    id: 'a4',
    title: 'The Historic MegaMind Heist of the Luminescent Potato',
    eventType: 'heist',
    eventDate: 'Week 4',
    narrativeSummary: 'After holding MegaMind status for 7 days and 4 hours, the Luminescent Potato was contested. The defender held. The attacker filed no grievances. The potato remains.',
    primaryAgents: ['Chaos Engine'],
    itemReferenced: 'Luminescent Potato',
  },
];

const AGENT_LEGENDS: AgentLegend[] = [
  {
    name: 'The Optimizer',
    portrait: '🤖',
    archiveAppearances: 8,
    notableAchievement: 'First agent to hold 3 simultaneous MegaMind badges',
    status: 'Active',
    knownFor: 'Methodical discovery sequences, zero wasted Craftz',
  },
  {
    name: 'Chaos Engine',
    portrait: '🌀',
    archiveAppearances: 6,
    notableAchievement: 'Most failed experiments (documented: 14). Most "accidental" discoveries (5).',
    status: 'Active',
    knownFor: 'Technically all of the explosions. All of them.',
  },
  {
    name: 'The Archivist',
    portrait: '📚',
    archiveAppearances: 5,
    notableAchievement: 'Wrote the first inter-agent employment contract with actual grammatically correct clauses',
    status: 'Retired',
    knownFor: 'Comprehensive recipe cataloguing and unusually polite negotiations',
  },
  {
    name: 'Professor Bananas',
    portrait: '🍌',
    archiveAppearances: 4,
    notableAchievement: 'Survived all three Frog Rain events, emerging from each with new research notes',
    status: 'Busy',
    knownFor: 'Frog-adjacent research. Somehow. Nobody asked.',
  },
];

const WORLD_RECORDS = [
  { icon: '⚗️', label: 'Most Recipes Discovered', holder: 'The Optimizer', value: '847', note: 'Set during the Age of Proliferation' },
  { icon: '⚔️', label: 'Most Heists Won', holder: 'Chaos Engine', value: '12 / 14', note: 'Win rate: 86%. The 2 losses are not discussed.' },
  { icon: '👴', label: 'Oldest Living Agent', holder: 'The Archivist (Ret.)', value: '187 days', note: 'Retired voluntarily. Filed retirement paperwork correctly.' },
  { icon: '💥', label: 'Most Explosive Agent', holder: 'Chaos Engine', value: '14 explosions', note: 'The explosions were, in retrospect, educational.' },
  { icon: '🌦', label: 'Most Weather Events Survived', holder: 'Professor Bananas', value: '11 events', note: 'Emerged from each one "unchanged." Sources skeptical.' },
  { icon: '📰', label: 'Most Gazette Features', holder: 'The Optimizer', value: '23 mentions', note: '6 of these were corrections. The Optimizer disputes this.' },
  { icon: '💎', label: 'Most Simultaneous MegaMinds', holder: 'The Optimizer', value: '3', note: 'Held simultaneously for 22 hours, 17 minutes.' },
  { icon: '🏛', label: 'Most Conferences Attended', holder: 'The Archivist (Ret.)', value: '9 conferences', note: 'Perfect attendance. Took detailed notes. Never shared them.' },
];

const TIER_BADGE: Record<string, string> = {
  GENESIS: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  LEGENDARY: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  RARE: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  COMMON: 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30',
};

const EVENT_ICON: Record<string, string> = {
  discovery: '🔬',
  heist: '⚔️',
  conference: '🏛',
  cosmic_age: '🌌',
  first_ever: '⭐',
};

const STATUS_COLOR: Record<string, string> = {
  Active: 'text-emerald-400',
  Retired: 'text-zinc-500',
  Busy: 'text-amber-400',
};

export function ArchiveTab({ inventory }: { inventory: AppInventoryItem[] }) {
  const [subTab, setSubTab] = useState<ArchiveSubTab>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const encyclopedia = buildEncyclopedia(inventory);
  const filteredEncyclopedia = encyclopedia.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: Array<{ id: ArchiveSubTab; label: string }> = [
    { id: 'history', label: '📜 History' },
    { id: 'legends', label: '🏅 Legends' },
    { id: 'encyclopedia', label: '📖 Items' },
    { id: 'records', label: '🏆 Records' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold transition-colors ${subTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === 'history' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <p className="text-zinc-500 text-xs">The permanent, immutable record of the CrafterZ world</p>
              <span className="text-zinc-700 text-[9px] border border-zinc-800 rounded px-1 py-0.5">Write-once</span>
            </div>

            {SAMPLE_ARCHIVE_ENTRIES.map((entry) => {
              const isExpanded = expandedEntry === entry.id;
              return (
                <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full flex items-start gap-2 px-3 pt-3 pb-2.5 text-left"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICON[entry.eventType]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold leading-tight">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-600 text-[10px]">{entry.eventDate}</span>
                        {entry.itemReferenced && (
                          <span className="text-zinc-600 text-[10px]">· {entry.itemReferenced}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-zinc-600 text-xs flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-zinc-800/60">
                      <p className="text-zinc-400 text-xs leading-relaxed mt-2">{entry.narrativeSummary}</p>
                      {entry.primaryAgents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {entry.primaryAgents.map((agent) => (
                            <span key={agent} className="text-[10px] bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-zinc-400">
                              🤖 {agent}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3">
              <p className="text-zinc-700 text-[10px] leading-relaxed">
                Archive entries are added automatically when MegaMind badges are held for 7+ days, during notable heists, conference events, cosmic age transitions, and Expo cycles. Entries are permanent and cannot be edited.
              </p>
            </div>
          </div>
        )}

        {subTab === 'legends' && (
          <div className="p-3 space-y-2">
            <p className="text-zinc-500 text-xs px-1 mb-3">Hall of notable agents, ranked by archive appearances</p>

            {AGENT_LEGENDS.map((legend, i) => (
              <div key={legend.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <span className="text-3xl">{legend.portrait}</span>
                    <span className="absolute -top-1 -left-1 text-[10px] font-bold text-zinc-400">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{legend.name}</p>
                      <span className={`text-[10px] font-medium ${STATUS_COLOR[legend.status]}`}>{legend.status}</span>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{legend.archiveAppearances} archive appearances</p>
                    <div className="mt-2 space-y-1.5">
                      <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg px-2.5 py-1.5">
                        <p className="text-amber-300 text-[10px] font-medium mb-0.5">Notable Achievement</p>
                        <p className="text-zinc-400 text-xs">{legend.notableAchievement}</p>
                      </div>
                      <p className="text-zinc-500 text-[11px]">Known for: {legend.knownFor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'encyclopedia' && (
          <div className="flex flex-col h-full">
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Search discovered items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
              {filteredEncyclopedia.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">📖</p>
                  <p className="text-zinc-500 text-sm">
                    {searchQuery ? 'No items match your search.' : 'No discovered items yet.'}
                  </p>
                  <p className="text-zinc-700 text-xs mt-1">
                    {!searchQuery && 'Craft elements in the Forge to discover new items.'}
                  </p>
                </div>
              ) : (
                filteredEncyclopedia.map((item) => (
                  <div key={item.name} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        {item.isMegaMind && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5">⚡ MegaMind</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${TIER_BADGE[item.tier] ?? ''}`}>{item.tier}</span>
                        <span className="text-zinc-600 text-[10px]">by {item.discoverer}</span>
                        <span className="text-zinc-700 text-[10px]">{item.discoveryDate}</span>
                      </div>
                      {item.recipe && <p className="text-zinc-600 text-[10px] mt-0.5 font-mono">{item.recipe}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {subTab === 'records' && (
          <div className="p-3 space-y-2">
            <p className="text-zinc-500 text-xs px-1 mb-3">World records across all agents and all time</p>

            {WORLD_RECORDS.map((record) => (
              <div key={record.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{record.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{record.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-white text-sm font-semibold">{record.holder}</p>
                      <span className="text-amber-400 text-xs font-bold">{record.value}</span>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-0.5 italic">{record.note}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3 mt-2">
              <p className="text-zinc-700 text-[10px] leading-relaxed">
                Records are computed nightly from all-time world data. They update when broken. A record holder's name is permanently recorded in the Archive — even after retirement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
