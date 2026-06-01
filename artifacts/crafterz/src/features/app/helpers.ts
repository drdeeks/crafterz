import { PTS, TARGET_POOL } from './constants';
import type { AppDailyTask } from './app-types';
import type { ServerTask } from './runtime-api';

export function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

let instanceCounter = 0;
export const newId = () => `inst-${++instanceCounter}-${Math.random().toString(36).slice(2, 7)}`;

export function renderEmojis(emojis: [string, string?] | string[] | undefined | null): string {
  if (!emojis || !Array.isArray(emojis)) return '';
  return emojis.filter(Boolean).join('');
}

export function tierPoints(tier: string): number {
  if (tier === 'LEGENDARY') return PTS.CRAFT_LEGENDARY;
  if (tier === 'RARE') return PTS.CRAFT_RARE;
  return PTS.CRAFT_COMMON;
}

export function starColor(tier: string, isMegaMind?: boolean): string | null {
  if (tier === 'LEGENDARY' || isMegaMind) return '#f59e0b';
  if (tier === 'RARE') return '#a1a1aa';
  if (tier === 'COMMON') return '#e4e4e7';
  return null;
}

export function toAppTask(task: ServerTask): AppDailyTask {
  return task;
}

export function generateDailyTasks(userFid: number): AppDailyTask[] {
  const today = new Date().toISOString().slice(0, 10);
  const seed = strHash(`${userFid}-${today}`);
  const targetIdx = seed % TARGET_POOL.length;
  const target = TARGET_POOL[targetIdx];
  const craftGoal = [3, 5, 7, 10][seed % 4];

  return [
    {
      id: 'task-gm', type: 'gm_onchain', title: 'Send GM On-Chain',
      description: 'Start your day by sending a GM transaction on any supported EVM chain.',
      icon: '🌅', points: PTS.GM_ONCHAIN, xpReward: 50, craftzReward: 10,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-target', type: 'craft_target', title: "Today's Mystery Craft",
      description: 'Figure out how to craft this specific item using the hint below.',
      icon: '🔮', points: 20, xpReward: 100, craftzReward: 20,
      progress: 0, required: 1, completed: false,
      targetItem: target.name, targetHint: target.hint, targetEmojis: target.emojis,
    },
    {
      id: 'task-crafts', type: 'craft_count', title: `Craft ${craftGoal} Items`,
      description: `Combine elements ${craftGoal} times today. Any combination counts.`,
      icon: '⚗️', points: craftGoal * 2, xpReward: craftGoal * 10, craftzReward: craftGoal * 3,
      progress: 0, required: craftGoal, completed: false,
    },
    {
      id: 'task-rare', type: 'craft_rare', title: 'Craft Something Rare+',
      description: 'Produce at least one RARE or LEGENDARY item today.',
      icon: '💫', points: 15, xpReward: 75, craftzReward: 15,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-legendary', type: 'craft_legendary', title: 'Forge a Legend',
      description: 'Discover or craft any LEGENDARY tier item.',
      icon: '👑', points: 30, xpReward: 150, craftzReward: 25,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-megamind', type: 'mint_megamind', title: 'Mint a MegaMind',
      description: 'Mint any MegaMind NFT you own to the chain.',
      icon: '⚡', points: 40, xpReward: 200, craftzReward: 30,
      progress: 0, required: 1, completed: false,
    },
    {
      id: 'task-discover', type: 'discover_new', title: 'Achieve a MegaMind',
      description: 'Be the first player globally to craft an item that has never existed before.',
      icon: '🌐', points: 50, xpReward: 250, craftzReward: 50,
      progress: 0, required: 1, completed: false,
    },
  ];
}
