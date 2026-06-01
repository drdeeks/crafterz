import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  fetchLeaderboardSnapshot,
  ServerPlayer,
} from '../runtime-api';
import { toDiscoveryFeed, DiscoveryFeedItem } from '../discovery-feed';

export type SyncHealth = 'syncing' | 'live' | 'offline';

export interface UseServerSyncReturn {
  myPoints: number;
  setMyPoints: React.Dispatch<React.SetStateAction<number>>;
  myMegaMinds: number;
  setMyMegaMinds: React.Dispatch<React.SetStateAction<number>>;
  myCrafts: number;
  setMyCrafts: React.Dispatch<React.SetStateAction<number>>;
  serverPlayers: ServerPlayer[];
  syncHealth: SyncHealth;
  syncColor: string;
  syncLabel: string;
  recentDiscoveries: DiscoveryFeedItem[];
  setRecentDiscoveries: React.Dispatch<React.SetStateAction<DiscoveryFeedItem[]>>;
  leaderboardData: LeaderboardRow[];
  myRank: number | string;
  syncFromServerPlayer: (player?: ServerPlayer | null) => void;
  refreshServerSnapshot: () => Promise<void>;
}

export type LeaderboardRow = {
  username: string;
  pfp: string;
  points: number;
  megaMinds: number;
  crafts: number;
  rank: number;
  isCurrentUser: boolean;
};

export function useServerSync(): UseServerSyncReturn {
  const [myPoints, setMyPoints] = useState(0);
  const [myMegaMinds, setMyMegaMinds] = useState(0);
  const [myCrafts, setMyCrafts] = useState(0);
  const [serverPlayers, setServerPlayers] = useState<ServerPlayer[]>([]);
  const [syncHealth, setSyncHealth] = useState<SyncHealth>('syncing');
  const [recentDiscoveries, setRecentDiscoveries] = useState<DiscoveryFeedItem[]>([]);

  const syncFromServerPlayer = useCallback((player?: ServerPlayer | null) => {
    if (!player) return;
    setMyPoints(player.points);
    setMyCrafts(player.crafts);
    setMyMegaMinds(player.megaMinds);
  }, []);

  const refreshServerSnapshot = useCallback(async () => {
    setSyncHealth((prev) => (prev === 'live' ? 'live' : 'syncing'));
    const snapshot = await fetchLeaderboardSnapshot(50);
    if (!snapshot) {
      setSyncHealth('offline');
      return;
    }
    setSyncHealth('live');
    const currentPlayer = snapshot.leaderboard.find(
      (p) => p.fid === 0 || p.agentId === 'fid:0',
    );
    syncFromServerPlayer(currentPlayer);
    setServerPlayers(
      snapshot.leaderboard.filter((p) => p.fid !== 0 && p.agentId !== 'fid:0'),
    );
    const feed = toDiscoveryFeed(snapshot.recentActivity);
    if (feed.length > 0) setRecentDiscoveries(feed);
  }, [syncFromServerPlayer]);

  useEffect(() => {
    void refreshServerSnapshot();
    const interval = setInterval(() => void refreshServerSnapshot(), 15000);
    return () => clearInterval(interval);
  }, [refreshServerSnapshot]);

  const leaderboardData = useMemo<LeaderboardRow[]>(() => {
    const basePlayers = serverPlayers.map((p) => ({
      username: p.username ?? p.agentId,
      pfp: `https://api.dicebear.com/9.x/lorelei/svg?seed=${p.username ?? p.agentId}`,
      points: p.points,
      megaMinds: p.megaMinds,
      crafts: p.crafts,
    }));
    const me = {
      username: 'you',
      pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=you',
      points: myPoints,
      megaMinds: myMegaMinds,
      crafts: myCrafts,
    };
    const all = [...basePlayers.filter((p) => p.username !== 'you'), me]
      .sort((a, b) => b.points - a.points);
    return all.map((p, i) => ({ ...p, rank: i + 1, isCurrentUser: p.username === 'you' }));
  }, [myPoints, myMegaMinds, myCrafts, serverPlayers]);

  const myRank = leaderboardData.find((p) => p.isCurrentUser)?.rank ?? (myPoints > 0 ? 1 : '--');

  const syncColor =
    syncHealth === 'live' ? 'bg-emerald-400'
    : syncHealth === 'syncing' ? 'bg-amber-400'
    : 'bg-red-400';
  const syncLabel =
    syncHealth === 'live' ? 'Live'
    : syncHealth === 'syncing' ? 'Syncing'
    : 'Offline';

  return {
    myPoints, setMyPoints,
    myMegaMinds, setMyMegaMinds,
    myCrafts, setMyCrafts,
    serverPlayers,
    syncHealth, syncColor, syncLabel,
    recentDiscoveries, setRecentDiscoveries,
    leaderboardData,
    myRank,
    syncFromServerPlayer,
    refreshServerSnapshot,
  };
}
