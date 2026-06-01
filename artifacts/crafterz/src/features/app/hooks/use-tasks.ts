import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchTasks, completeTask, progressTask } from '../runtime-api';
import type { AppDailyTask, AppDailyTaskType } from '../app-types';
import { generateDailyTasks, toAppTask } from '../helpers';

export interface UseTasksReturn {
  dailyTasks: AppDailyTask[];
  setDailyTasks: React.Dispatch<React.SetStateAction<AppDailyTask[]>>;
  tasksCompleted: number;
  tasksTotal: number;
  tasksPendingClaim: number;
  gmSent: boolean;
  advanceTask: (type: AppDailyTaskType, by?: number, matchName?: string) => void;
  claimTask: (taskId: string, onClaim: (task: AppDailyTask) => void) => void;
}

export function useTasks(): UseTasksReturn {
  const [dailyTasks, setDailyTasks] = useState<AppDailyTask[]>(() => generateDailyTasks(0));
  const dailyTasksRef = useRef<AppDailyTask[]>([]);
  dailyTasksRef.current = dailyTasks;

  useEffect(() => {
    void fetchTasks(0).then((tasks) => {
      if (tasks) setDailyTasks(tasks.map(toAppTask));
    });
  }, []);

  const gmSent = dailyTasks.find((t) => t.type === 'gm_onchain')?.completed ?? false;

  const advanceTask = useCallback((type: AppDailyTaskType, by = 1, matchName?: string) => {
    const current = dailyTasksRef.current;
    let progressedTaskId: string | null = null;

    for (const t of current) {
      if (t.completed) continue;
      if (t.type !== type) continue;
      if (type === 'craft_target' && matchName) {
        if (t.targetItem?.toLowerCase() !== matchName.toLowerCase()) continue;
      }
      if (t.progress < t.required) {
        progressedTaskId = t.id;
        break;
      }
    }

    setDailyTasks((tasks) =>
      tasks.map((t) => {
        if (t.completed) return t;
        if (t.type !== type) return t;
        if (type === 'craft_target' && matchName) {
          if (t.targetItem?.toLowerCase() !== matchName.toLowerCase()) return t;
        }
        return { ...t, progress: Math.min(t.required, t.progress + by) };
      }),
    );

    if (progressedTaskId) {
      void progressTask(0, progressedTaskId, by).then((serverTasks) => {
        if (serverTasks) setDailyTasks(serverTasks.map(toAppTask));
      });
    }
  }, []);

  const claimTask = useCallback((taskId: string, onClaim: (task: AppDailyTask) => void) => {
    const task = dailyTasksRef.current.find((t) => t.id === taskId);
    if (!task || task.completed || task.progress < task.required) return;
    setDailyTasks((tasks) =>
      tasks.map((t) => t.id === taskId ? { ...t, completed: true, claimedAt: Date.now() } : t),
    );
    onClaim(task);
    void completeTask(0, taskId).then((serverTasks) => {
      if (serverTasks) setDailyTasks(serverTasks.map(toAppTask));
    });
  }, []);

  return {
    dailyTasks,
    setDailyTasks,
    tasksCompleted: dailyTasks.filter((t) => t.completed).length,
    tasksTotal: dailyTasks.length,
    tasksPendingClaim: dailyTasks.filter((t) => !t.completed && t.progress >= t.required).length,
    gmSent,
    advanceTask,
    claimTask,
  };
}
