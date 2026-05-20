import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  highlight?: boolean;
}

export function MetricCard({ label, value, icon, highlight = false }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-2 ${
        highlight
          ? "border-[#FF4D1C]/30 bg-[#FF4D1C]/5"
          : "border-[#232323] bg-[#0A0A0A]"
      }`}
    >
      <div className="flex items-center justify-between text-[#A1A1A1]">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon && <span className={highlight ? "text-[#FF6B3D]" : "text-[#555]"}>{icon}</span>}
      </div>
      <p className={`text-3xl font-extrabold ${highlight ? "text-[#FF4D1C]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
