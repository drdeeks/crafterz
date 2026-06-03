import { useState, useRef } from 'react';
import { submitCaption } from '../runtime-api';
import type { ServerFeedEvent } from '../runtime-api';
import type { ServerCaption } from '../runtime-api';
import type { LeaderboardRow } from '../hooks/use-server-sync';

interface GazetteSection {
  title: string;
  icon: string;
  items: string[];
}

interface GazetteEdition {
  date: string;
  headline: string;
  sections: GazetteSection[];
}

const HEADLINES = [
  'Local Alchemist Combines Two Completely Unrelated Things, Somehow Succeeds',
  'Weather Patterns Baffle Observers; Frogs Reportedly Unfazed',
  'MegaMind Status Achieved; Discoverer Claims It Was Intentional',
  'Annual Report: 73% Of Crafting Explosions Were "Mostly Planned"',
  'Craftz Economy Shows Signs Of Definitely Being Fine',
  'Breaking: Something Has Been Combined With Something Else',
  'Scientists Baffled By Third Consecutive Meaningful Discovery This Week',
];

const WEATHER_DISPATCHES = [
  'Current atmospheric conditions: Unusual. This is considered normal.',
  'The celestial weather engine reports a 40% chance of cosmic significance.',
  'No scheduled weather events at this time. Residents are advised to remain vigilant.',
  'Sun Flare activity detected. Fire-adjacent elements are having what sources describe as "a moment".',
];

const RUMOR_DISPATCHES = [
  'Unverified: A player has allegedly discovered a recipe involving a frog and a concept. Officials neither confirm nor deny.',
  'Sources close to the Observatory suggest a guild meeting is "imminent." The same sources provided no further detail and then vanished.',
  'A senior agent was observed whispering to a potato for approximately 40 minutes. The potato has not commented.',
];

const EMPLOYMENT_NOTICES = [
  'WANTED: One reliable alchemist. Must be comfortable with occasional explosions. Craftz paid weekly.',
  'AVAILABLE: AI Brain agent with 3 successful experiments and only 2 documented chaos events. Inquire within.',
  'SEEKING: Research partner for long-term potato-adjacent investigation. No prior experience necessary.',
];

function pickByDay<T>(arr: T[]): T {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate();
  return arr[seed % arr.length];
}

function buildGazette(feedEvents: ServerFeedEvent[], captions: ServerCaption[]): GazetteEdition {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const discoveries = feedEvents.filter(e => e.kind === 'craft' || e.kind === 'megamind');
  const heists = feedEvents.filter(e => e.kind === 'heist_win' || e.kind === 'heist_loss');

  const discoveryItems = discoveries.length > 0
    ? discoveries.slice(0, 3).map(e =>
        `${e.actorUsername ?? 'an unnamed alchemist'} has reportedly combined two unrelated substances. ${e.headline}`
      )
    : [
        'No significant discoveries have been recorded. Experts speculate that everyone is "taking a break" or "asleep".',
        'The Crafting Registry remains suspiciously quiet today.',
      ];

  const heistItems = heists.length > 0
    ? heists.slice(0, 2).map(e =>
        `${e.actorUsername ?? 'a mysterious challenger'} initiated what appears to be a strategic repositioning of someone else\'s MegaMind badge. ${e.headline}`
      )
    : ['No heists recorded today. The MegaMind community is reportedly "behaving". This is considered suspicious.'];

  const captionItems = captions.slice(0, 3).map(c => c.captionText ?? 'Our correspondent filed an empty report. Their editor is not surprised.');

  return {
    date: today,
    headline: pickByDay(HEADLINES),
    sections: [
      { title: 'Discoveries', icon: '🔬', items: discoveryItems },
      { title: 'Heist Report', icon: '⚔️', items: heistItems },
      { title: 'Weather Intelligence', icon: '🌦', items: [pickByDay(WEATHER_DISPATCHES)] },
      {
        title: 'Field Dispatches',
        icon: '📻',
        items: captionItems.length > 0 ? captionItems : ['Our comedic correspondents are currently out of office. A potted plant is covering for them.'],
      },
      {
        title: 'Employment Board',
        icon: '📋',
        items: [pickByDay(EMPLOYMENT_NOTICES)],
      },
      {
        title: 'Rumors',
        icon: '🗣',
        items: [pickByDay(RUMOR_DISPATCHES)],
      },
    ],
  };
}

type GazetteSubTab = 'gazette' | 'feed' | 'leaderboard';

export function GazetteTab({
  feedEvents,
  feedLoading,
  captions,
  leaderboardData,
  onReactCaption,
  onReportCaption,
}: {
  feedEvents: ServerFeedEvent[];
  feedLoading: boolean;
  captions: ServerCaption[];
  leaderboardData: LeaderboardRow[];
  onReactCaption: (id: string) => void;
  onReportCaption: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<GazetteSubTab>('gazette');
  const gazette = buildGazette(feedEvents, captions);

  const subTabs: Array<{ id: GazetteSubTab; label: string }> = [
    { id: 'gazette', label: '📰 Gazette' },
    { id: 'feed', label: '📡 Live Feed' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${subTab === t.id ? 'text-white border-b-2 border-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === 'gazette' && <GazetteEditionView gazette={gazette} />}
        {subTab === 'feed' && (
          <FeedView
            feedEvents={feedEvents}
            feedLoading={feedLoading}
            captions={captions}
            onReactCaption={onReactCaption}
            onReportCaption={onReportCaption}
          />
        )}
        {subTab === 'leaderboard' && <LeaderboardView rows={leaderboardData} />}
      </div>
    </div>
  );
}

function LeaderboardView({ rows }: { rows: LeaderboardRow[] }) {
  const medals = ['🥇', '🥈', '🥉'];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
        <span className="text-3xl">🏆</span>
        <p className="text-zinc-500 text-sm">Leaderboard is loading…</p>
        <p className="text-zinc-700 text-xs">Rankings update every 15 seconds from the live server.</p>
      </div>
    );
  }

  const myRow = rows.find(r => r.isCurrentUser);

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-zinc-500 text-xs">Global Rankings</p>
        <p className="text-zinc-700 text-[10px]">{rows.length} players · live</p>
      </div>

      {myRow && myRow.rank > 5 && (
        <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl px-3 py-2 flex items-center gap-3 mb-2">
          <span className="text-zinc-400 text-sm font-bold w-8 text-center">#{myRow.rank}</span>
          <img src={myRow.pfp} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-xs font-semibold">you (your position)</p>
            <p className="text-zinc-500 text-[10px]">{myRow.crafts} crafts · {myRow.megaMinds} MegaMinds</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-amber-400 text-xs font-bold">{myRow.points.toLocaleString()}</p>
            <p className="text-zinc-700 text-[9px]">pts</p>
          </div>
        </div>
      )}

      {rows.slice(0, 20).map((player) => (
        <div
          key={player.username}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
            player.isCurrentUser
              ? 'bg-amber-950/20 border-amber-600/30'
              : player.rank <= 3
              ? 'bg-zinc-900/80 border-zinc-700/60'
              : 'bg-zinc-900/40 border-zinc-800/50'
          }`}
        >
          <span className="text-sm font-bold w-8 text-center flex-shrink-0">
            {player.rank <= 3 ? medals[player.rank - 1] : `#${player.rank}`}
          </span>
          <img src={player.pfp} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${player.isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
              {player.isCurrentUser ? `${player.username} (you)` : player.username}
            </p>
            <p className="text-zinc-600 text-[10px]">{player.crafts} crafts · {player.megaMinds} MMs</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-amber-400 text-xs font-bold">{player.points.toLocaleString()}</p>
            <p className="text-zinc-700 text-[9px]">pts</p>
          </div>
        </div>
      ))}

      <p className="text-zinc-700 text-[9px] text-center pt-1">
        Points from crafts, MegaMinds, heist wins, and daily tasks. Leaderboard refreshes every 15s.
      </p>
    </div>
  );
}

function GazetteEditionView({ gazette }: { gazette: GazetteEdition }) {
  return (
    <div className="p-4 space-y-5">
      <div className="text-center border-b border-zinc-800 pb-4">
        <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] mb-1">The Daily</p>
        <h1 className="text-2xl font-black text-amber-400 tracking-tight">CRAFTERZ GAZETTE</h1>
        <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] mt-1">{gazette.date}</p>
        <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
          <p className="text-white text-sm font-semibold italic">"{gazette.headline}"</p>
        </div>
      </div>

      {gazette.sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <div className="flex items-center gap-2">
            <span>{section.icon}</span>
            <h3 className="text-amber-400 text-xs font-bold uppercase tracking-[0.15em]">{section.title}</h3>
            <div className="flex-1 border-t border-zinc-800" />
          </div>
          <div className="space-y-2">
            {section.items.map((item, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5">
                <p className="text-zinc-300 text-xs leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center pt-2 pb-4">
        <p className="text-zinc-700 text-[9px]">
          The Crafterz Gazette is generated daily. All content is fictional and deadpan by design.
          Any resemblance to actual events is a statistical coincidence.
        </p>
      </div>
    </div>
  );
}

function FeedView({
  feedEvents,
  feedLoading,
  captions,
  onReactCaption,
  onReportCaption,
}: {
  feedEvents: ServerFeedEvent[];
  feedLoading: boolean;
  captions: ServerCaption[];
  onReactCaption: (id: string) => void;
  onReportCaption: (id: string) => void;
}) {
  const [dispatchText, setDispatchText] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSent, setDispatchSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmitDispatch() {
    const trimmed = dispatchText.trim();
    if (!trimmed || trimmed.length < 5) return;
    setDispatching(true);
    try {
      const result = await submitCaption(trimmed);
      if (result) {
        setDispatchText('');
        setDispatchSent(true);
        setTimeout(() => setDispatchSent(false), 3000);
      }
    } finally {
      setDispatching(false);
    }
  }

  const kindIcon: Record<string, string> = {
    craft: '⚗️',
    megamind: '💎',
    heist_win: '⚔️',
    heist_loss: '🛡',
    propaganda: '📢',
    mint: '🎨',
  };

  return (
    <div className="p-3 space-y-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">📢 Submit Field Dispatch</p>
        <textarea
          ref={textareaRef}
          value={dispatchText}
          onChange={(e) => setDispatchText(e.target.value)}
          placeholder="Write your dispatch for the live feed… (5–200 chars)"
          maxLength={200}
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-zinc-700 text-[10px]">{dispatchText.length}/200</span>
          {dispatchSent ? (
            <span className="text-emerald-400 text-xs font-semibold">✓ Dispatched!</span>
          ) : (
            <button
              onClick={handleSubmitDispatch}
              disabled={dispatching || dispatchText.trim().length < 5}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                dispatching || dispatchText.trim().length < 5
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-400 text-zinc-900 hover:bg-amber-300'
              }`}
            >
              {dispatching ? 'Sending…' : 'Send Dispatch'}
            </button>
          )}
        </div>
      </div>

      {feedLoading && feedEvents.length === 0 && captions.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-zinc-600 text-xs">Loading live feed…</p>
        </div>
      )}

      {!feedLoading && feedEvents.length === 0 && captions.length === 0 && (
        <div className="flex flex-col items-center justify-center h-24 gap-2 px-6 text-center">
          <span className="text-2xl">📡</span>
          <p className="text-zinc-600 text-xs">The feed awakens when players craft and discover.</p>
        </div>
      )}

      {captions.length > 0 && (
        <div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">Comedy Dispatches</p>
          {captions.slice(0, 8).map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-2">
              <p className="text-zinc-300 text-xs leading-relaxed">{c.captionText}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => onReactCaption(c.id)}
                  className="flex items-center gap-1 text-zinc-600 hover:text-amber-400 text-[10px] transition-colors"
                >
                  😂 {c.hahCount}
                </button>
                <button
                  onClick={() => onReportCaption(c.id)}
                  className="text-zinc-700 hover:text-red-500 text-[10px] transition-colors"
                >
                  Report
                </button>
                {c.isAiGenerated && (
                  <span className="text-zinc-700 text-[9px] ml-auto">AI-generated</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {feedEvents.length > 0 && (
        <div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2 px-1">World Events</p>
          {feedEvents.map((e, i) => (
            <div key={e.id ?? i} className="flex items-start gap-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5 mb-1.5">
              <span className="text-base flex-shrink-0">{kindIcon[e.kind] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-xs leading-relaxed">{e.headline}</p>
                {e.detail && <p className="text-zinc-500 text-[11px] mt-0.5">{e.detail}</p>}
                <p className="text-zinc-600 text-[10px] mt-0.5">
                  {e.actorUsername} · {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
