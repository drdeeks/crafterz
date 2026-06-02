import { useState } from 'react';
import type { ServerFeedEvent } from '../runtime-api';
import type { ServerCaption } from '../runtime-api';
import type { LeaderboardRow } from '../hooks/use-server-sync';
import type { EmojiRenderer } from '../app-types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TIER_COLORS: Record<string, string> = {
  LEGENDARY: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  RARE: 'text-violet-400 bg-violet-400/10 border border-violet-400/30',
  COMMON: 'text-zinc-400 bg-zinc-800 border border-zinc-700',
  GENESIS: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
};

function FeedCard({ event }: { event: ServerFeedEvent }) {
  const isPropaganda = event.kind === 'propaganda';
  const isMega = event.kind === 'megamind';
  const isHeistWin = event.kind === 'heist_win';
  const isHeistLoss = event.kind === 'heist_loss';

  if (isPropaganda) {
    return (
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-lg leading-none">
            {event.actorPortrait}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-purple-300 text-xs font-bold">{event.actorUsername}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold tracking-wider">AGENT BROADCAST</span>
            </div>
            <p className="text-zinc-200 text-xs leading-relaxed italic">"{event.headline}"</p>
            {event.detail && (
              <p className="text-zinc-600 text-[10px] mt-1">{event.detail}</p>
            )}
          </div>
          <span className="text-zinc-700 text-[10px] flex-shrink-0">{timeAgo(event.timestamp)}</span>
        </div>
      </div>
    );
  }

  if (isHeistWin || isHeistLoss) {
    return (
      <div className={`rounded-xl border px-3 py-2.5 ${isHeistWin ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-700 bg-zinc-900/50'}`}>
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base leading-none">
            {isHeistWin ? '⚔️' : '🛡️'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold leading-snug ${isHeistWin ? 'text-amber-300' : 'text-zinc-300'}`}>
              {event.headline}
            </p>
            {event.detail && <p className="text-zinc-500 text-[10px] mt-0.5">{event.detail}</p>}
          </div>
          <span className="text-zinc-700 text-[10px] flex-shrink-0">{timeAgo(event.timestamp)}</span>
        </div>
      </div>
    );
  }

  // craft or megamind
  const isAvatar = event.actorPortrait.startsWith('http');
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${isMega ? 'border-amber-400/40 bg-amber-400/5' : 'border-zinc-800 bg-zinc-900/60'}`}>
      <div className="flex items-center gap-2.5">
        {isAvatar ? (
          <img src={event.actorPortrait} className="w-7 h-7 rounded-full border border-zinc-700 flex-shrink-0" alt="" />
        ) : (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm leading-none">
            {event.actorPortrait}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-zinc-400 text-[10px] font-medium truncate">
            <span className={`font-semibold ${isMega ? 'text-amber-300' : 'text-white'}`}>{event.actorUsername}</span>
            {' '}{isMega ? 'made a first discovery' : 'crafted'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {event.emojis && event.emojis.length > 0 && (
              <span className="text-base leading-none">{event.emojis.join('')}</span>
            )}
            <p className={`text-xs font-bold truncate ${isMega ? 'text-amber-200' : 'text-white'}`}>
              {event.headline.replace(/^.*?\s(?:crafted|forged)\s/, '')}
            </p>
            {event.tier && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${TIER_COLORS[event.tier] ?? TIER_COLORS.COMMON}`}>
                {event.tier}
              </span>
            )}
            {isMega && <span className="text-amber-400 text-[9px] font-bold flex-shrink-0">✨ FIRST</span>}
          </div>
          {event.detail && (
            <p className="text-zinc-600 text-[10px] mt-0.5">{event.detail}</p>
          )}
        </div>
        <span className="text-zinc-700 text-[10px] flex-shrink-0">{timeAgo(event.timestamp)}</span>
      </div>
    </div>
  );
}

function CaptionCard({
  caption,
  reacted,
  onReact,
  onReport,
  tierBadge,
}: {
  caption: ServerCaption;
  reacted: boolean;
  onReact: () => void;
  onReport: () => void;
  tierBadge: Record<string, string>;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-base leading-none flex-shrink-0 mt-0.5">📰</span>
        <p className="text-zinc-200 text-xs leading-relaxed flex-1">{caption.captionText}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tierBadge[caption.tier] ?? 'bg-zinc-800 text-zinc-400'}`}>{caption.tier}</span>
          <span className="text-zinc-600 text-[10px]">{caption.itemName}</span>
          {caption.isAiGenerated && <span className="text-[9px] text-purple-500">✦ AI</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 text-[10px]">{timeAgo(caption.createdAt)}</span>
          <button
            onClick={onReact}
            className={`text-xs transition-colors ${reacted ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'}`}
            title="Ha-ha!"
          >
            🤣 {caption.hahCount > 0 ? caption.hahCount : ''}
          </button>
          <button
            onClick={onReport}
            className="text-[10px] text-zinc-700 hover:text-red-500 transition-colors"
            title="Report"
          >
            🚩
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedTab({
  feedEvents,
  feedLoading,
  captions,
  leaderboardData,
  myRank,
  renderEmojis,
  tierBadge,
  onReactCaption,
  onReportCaption,
}: {
  feedEvents: ServerFeedEvent[];
  feedLoading: boolean;
  captions: ServerCaption[];
  leaderboardData: LeaderboardRow[];
  myRank: number | string;
  renderEmojis: EmojiRenderer;
  tierBadge: Record<string, string>;
  onReactCaption: (id: string) => void;
  onReportCaption: (id: string) => void;
}) {
  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());
  const [showRankings, setShowRankings] = useState(false);

  function handleReact(id: string) {
    if (reactedIds.has(id)) return;
    setReactedIds((prev) => new Set([...prev, id]));
    onReactCaption(id);
  }

  const isEmpty = feedEvents.length === 0 && captions.length === 0;

  return (
    <div className="p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">📡 Live Feed</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold animate-pulse">LIVE</span>
        </div>
        <button
          onClick={() => setShowRankings((v) => !v)}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showRankings ? 'Hide rankings ↑' : '🏆 Rankings'}
        </button>
      </div>

      {/* Collapsible rankings */}
      {showRankings && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 mb-2">
          <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1.5 px-1">Global Rankings</p>
          {leaderboardData.slice(0, 5).map((player) => (
            <div key={player.username} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${player.isCurrentUser ? 'bg-amber-950/20' : ''}`}>
              <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-zinc-300' : player.rank === 3 ? 'text-amber-600' : 'text-zinc-600'}`}>
                {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
              </span>
              <img src={player.pfp} className="w-6 h-6 rounded-full border border-zinc-800 flex-shrink-0" alt="" />
              <p className={`text-xs font-semibold flex-1 truncate ${player.isCurrentUser ? 'text-amber-300' : 'text-white'}`}>
                {player.username}{player.isCurrentUser && ' (you)'}
              </p>
              <span className="text-amber-400 font-bold text-xs">{player.points.toLocaleString()}</span>
            </div>
          ))}
          <p className="text-zinc-700 text-[10px] text-center mt-1">
            Your rank: #{myRank}
          </p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !feedLoading && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📡</p>
          <p className="text-zinc-400 text-sm font-medium">No activity yet</p>
          <p className="text-zinc-600 text-xs mt-1">Start crafting to see the feed come alive</p>
          <p className="text-zinc-700 text-[10px] mt-2">Hire an agent to trigger their propaganda broadcast →</p>
        </div>
      )}

      {feedLoading && feedEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-600 text-xs animate-pulse">Loading feed…</p>
        </div>
      )}

      {/* Feed events */}
      {feedEvents.map((event) => (
        <FeedCard key={event.id} event={event} />
      ))}

      {/* Gazette captions divider */}
      {captions.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 pt-2">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">📰 Crafterz Gazette</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 font-bold">AI</span>
          </div>
          {captions.map((caption) => (
            <CaptionCard
              key={caption.id}
              caption={caption}
              reacted={reactedIds.has(caption.id)}
              onReact={() => handleReact(caption.id)}
              onReport={() => onReportCaption(caption.id)}
              tierBadge={tierBadge}
            />
          ))}
        </>
      )}

      <div className="pb-4" />
    </div>
  );
}
