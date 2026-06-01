type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
};

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white font-bold text-lg leading-none">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

type AdminActionProps = {
  icon: string;
  label: string;
  desc: string;
  variant?: "default" | "danger" | "success";
  onClick?: () => void;
};

export function AdminAction({
  icon,
  label,
  desc,
  variant = "default",
  onClick,
}: AdminActionProps) {
  const colors = {
    default: "border-zinc-800 hover:border-zinc-600 text-white",
    danger: "border-red-900/50 hover:border-red-700 text-red-400",
    success: "border-emerald-900/50 hover:border-emerald-700 text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3 transition-colors text-left ${colors[variant]}`}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${colors[variant]
            .split(" ")
            .find((token) => token.startsWith("text-"))}`}
        >
          {label}
        </p>
        <p className="text-zinc-600 text-xs mt-0.5 leading-tight">{desc}</p>
      </div>
      <span className="text-zinc-700 text-xs">›</span>
    </button>
  );
}

type TaskProgressBarProps = {
  progress: number;
  required: number;
};

export function TaskProgressBar({ progress, required }: TaskProgressBarProps) {
  const pct = Math.min(100, Math.round((progress / required) * 100));
  return (
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#22c55e" : "#f59e0b" }}
      />
    </div>
  );
}
