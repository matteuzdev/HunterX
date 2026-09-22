import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "rose";
}) {
  const accentMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-xl ${accentMap[accent]}`}><Icon className="size-4" /></span>
        <span className="text-[10px] font-semibold text-slate-400">{helper}</span>
      </div>
      <strong className="mt-5 block text-3xl font-black tracking-[-.04em] text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-semibold text-slate-600">{label}</span>
    </Card>
  );
}
