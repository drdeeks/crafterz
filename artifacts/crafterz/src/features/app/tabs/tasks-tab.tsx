import { TaskProgressBar } from '../ui-primitives';
import type { AppDailyTask, EvmChainOption } from '../app-types';

export function TasksTab({
  dailyTasks,
  tasksCompleted,
  tasksTotal,
  gmChain,
  evmChains,
  gmSent,
  gmSending,
  onSelectGmChain,
  onSendGm,
  onClaimTask,
}: {
  dailyTasks: AppDailyTask[];
  tasksCompleted: number;
  tasksTotal: number;
  gmChain: string;
  evmChains: EvmChainOption[];
  gmSent: boolean;
  gmSending: boolean;
  onSelectGmChain: (chainId: string) => void;
  onSendGm: () => void;
  onClaimTask: (taskId: string) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <TaskProgressHeader tasksCompleted={tasksCompleted} tasksTotal={tasksTotal} />

      {dailyTasks.filter((t) => t.type === 'gm_onchain').map((task) => (
        <GmTask
          key={task.id}
          task={task}
          gmChain={gmChain}
          evmChains={evmChains}
          gmSent={gmSent}
          gmSending={gmSending}
          onSelectGmChain={onSelectGmChain}
          onSendGm={onSendGm}
        />
      ))}

      {dailyTasks.filter((t) => t.type === 'craft_target').map((task) => (
        <MysteryTask key={task.id} task={task} onClaimTask={onClaimTask} />
      ))}

      {dailyTasks
        .filter((t) => t.type !== 'gm_onchain' && t.type !== 'craft_target')
        .map((task) => (
          <StandardTask key={task.id} task={task} onClaimTask={onClaimTask} />
        ))}

      <WeeklyBonus />

      <CraftzEconomyTip />

      <div className="pb-4" />
    </div>
  );
}

const WEEKLY_CHALLENGES = [
  { icon: '🔬', label: 'Discovery Chain', desc: 'Craft 5 items in a single session', reward: '+100 pts', progress: 2, required: 5, active: true },
  { icon: '⚔️', label: 'Heist Veteran', desc: 'Win 2 heists this week', reward: '+150 pts + 40⚡', progress: 0, required: 2, active: true },
  { icon: '🌦', label: 'Weather Rider', desc: 'Craft during 3 different weather events', reward: '+200 pts', progress: 1, required: 3, active: true },
];

function WeeklyBonus() {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59);
  const daysLeft = Math.ceil((endOfWeek.getTime() - now.getTime()) / (24 * 3600000));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-zinc-500 text-xs font-semibold">Weekly Challenges</p>
        <span className="text-zinc-700 text-[10px]">{daysLeft}d remaining</span>
      </div>
      {WEEKLY_CHALLENGES.map((ch) => {
        const pct = Math.min(100, Math.round((ch.progress / ch.required) * 100));
        return (
          <div key={ch.label} className={`rounded-xl border p-3 ${ch.progress >= ch.required ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="flex items-start gap-2.5">
              <span className="text-xl flex-shrink-0">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white text-xs font-semibold">{ch.label}</p>
                  <span className="text-amber-400 text-[10px] font-bold">{ch.reward}</span>
                </div>
                <p className="text-zinc-500 text-[10px] mt-0.5">{ch.desc}</p>
                {ch.required > 1 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-600">{ch.progress}/{ch.required}</span>
                      <span style={{ color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : '#f59e0b' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CraftzEconomyTip() {
  const tips = [
    '💡 Hints cost 5 Craftz each. Use them when you\'re stuck on a combination.',
    '💡 Heist victories award +30 Craftz in addition to points.',
    '💡 Hiring an AI Brain agent stacks with weather buffs — time your rentals accordingly.',
    '💡 First-ever discoveries award a +50 Craftz bonus on top of standard rewards.',
  ];
  const tip = tips[new Date().getDate() % tips.length];
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-3 py-2.5">
      <p className="text-zinc-500 text-[10px] leading-relaxed">{tip}</p>
    </div>
  );
}

function TaskProgressHeader({ tasksCompleted, tasksTotal }: { tasksCompleted: number; tasksTotal: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-sm">Daily Tasks</p>
          <p className="text-zinc-600 text-xs mt-0.5">Resets at midnight UTC</p>
        </div>
        <div className="text-right">
          <p className="text-amber-400 font-bold text-sm">{tasksCompleted}/{tasksTotal}</p>
          <p className="text-zinc-600 text-xs">completed</p>
        </div>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(tasksCompleted / tasksTotal) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #22c55e)' }}
        />
      </div>
      {tasksCompleted === tasksTotal && (
        <p className="text-emerald-400 text-xs font-semibold text-center mt-2">🎉 All tasks complete! Come back tomorrow.</p>
      )}
    </div>
  );
}

function GmTask({ task, gmChain, evmChains, gmSent, gmSending, onSelectGmChain, onSendGm }: {
  task: AppDailyTask;
  gmChain: string;
  evmChains: EvmChainOption[];
  gmSent: boolean;
  gmSending: boolean;
  onSelectGmChain: (chainId: string) => void;
  onSendGm: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 ${task.completed ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{task.title}</p>
            <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
            <span className="text-blue-400 text-xs">+{task.craftzReward} Craftz</span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{task.description}</p>
          {!task.completed && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {evmChains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => onSelectGmChain(chain.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${gmChain === chain.id ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600'}`}
                  >
                    {chain.icon} {chain.name}
                  </button>
                ))}
              </div>
              <button
                onClick={onSendGm}
                disabled={gmSent || gmSending}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${gmSent ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 cursor-default' : gmSending ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
              >
                {gmSent ? '✓ GM Sent!' : gmSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-zinc-500 border-t-violet-400 rounded-full animate-spin inline-block" />
                    Broadcasting on {evmChains.find((c) => c.id === gmChain)?.name}…
                  </span>
                ) : `🌅 Send GM on ${evmChains.find((c) => c.id === gmChain)?.name}`}
              </button>
            </div>
          )}
          {task.completed && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-emerald-400 text-xs font-semibold">✓ Completed</span>
              <span className="text-zinc-600 text-xs">· Claimed {task.points} pts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MysteryTask({ task, onClaimTask }: {
  task: AppDailyTask;
  onClaimTask: (taskId: string) => void;
}) {
  const revealed = task.progress >= task.required || task.completed;
  return (
    <div className={`rounded-xl border p-4 ${task.completed ? 'bg-emerald-950/10 border-emerald-600/25' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{task.title}</p>
            <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
            <span className="text-blue-400 text-xs">+{task.craftzReward} Craftz</span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{task.description}</p>
          <div className={`mt-3 rounded-xl border p-3 flex items-center gap-3 ${revealed ? 'bg-amber-950/20 border-amber-500/30' : 'bg-zinc-800/60 border-zinc-700'}`}>
            <div className="text-3xl w-10 text-center">
              {revealed ? (task.targetEmoji ?? '❓') : '❓'}
            </div>
            <div>
              <p className={`text-sm font-bold ${revealed ? 'text-amber-300' : 'text-zinc-400'}`}>
                {revealed ? task.targetItem : '??? Mystery Item'}
              </p>
              <p className="text-zinc-600 text-xs mt-0.5">💡 {task.targetHint}</p>
            </div>
          </div>
          {!task.completed && task.progress < task.required && (
            <p className="text-zinc-600 text-[10px] mt-2">Head to the canvas and experiment — the hint should point you in the right direction.</p>
          )}
          {!task.completed && task.progress >= task.required && (
            <button onClick={() => onClaimTask(task.id)} className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
              🎉 Claim Reward
            </button>
          )}
          {task.completed && <p className="text-emerald-400 text-xs font-semibold mt-2">✓ Completed · +{task.points} pts claimed</p>}
        </div>
      </div>
    </div>
  );
}

function StandardTask({ task, onClaimTask }: {
  task: AppDailyTask;
  onClaimTask: (taskId: string) => void;
}) {
  const isDone = task.completed;
  const isReady = !isDone && task.progress >= task.required;
  const pct = Math.min(100, Math.round((task.progress / task.required) * 100));

  return (
    <div className={`rounded-xl border p-4 ${isDone ? 'bg-emerald-950/10 border-emerald-600/25' : isReady ? 'bg-amber-950/15 border-amber-500/35' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-bold text-sm truncate ${isDone ? 'text-emerald-300' : 'text-white'}`}>{task.title}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-amber-400 text-xs font-bold">+{task.points} pts</span>
              <span className="text-blue-400 text-xs">+{task.craftzReward}⚡</span>
            </div>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{task.description}</p>
          {task.required > 1 && !isDone && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-600">{task.progress}/{task.required}</span>
                <span style={{ color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
              </div>
              <TaskProgressBar progress={task.progress} required={task.required} />
            </div>
          )}
          {isDone && <p className="text-emerald-400 text-xs font-semibold mt-2">✓ Completed · +{task.points} pts claimed</p>}
          {isReady && (
            <button onClick={() => onClaimTask(task.id)} className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
              🎉 Claim Reward
            </button>
          )}
          {!isDone && !isReady && task.required === 1 && (
            <p className="text-zinc-700 text-[10px] mt-1.5">
              {task.type === 'discover_new' ? 'Craft an item no one has ever created — your MegaMind will auto-detect on the canvas.'
                : task.type === 'mint_megamind' ? 'Mint any MegaMind from the 💎 Mega tab to complete this task.'
                : task.type === 'craft_legendary' ? 'Craft a Legendary-tier item on the canvas to complete this.'
                : 'Complete this action on the canvas to unlock the reward.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
