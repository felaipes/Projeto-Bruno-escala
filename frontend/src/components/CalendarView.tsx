"use client";
import { useMemo } from "react";
import type { ShiftAssignment } from "@/lib/api";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

interface CalendarViewProps {
  month: number;
  year: number;
  assignments: ShiftAssignment[];
  collaboratorId?: string;
  onDayClick?: (date: string) => void;
}

export function CalendarView({ month, year, assignments, collaboratorId, onDayClick }: CalendarViewProps) {
  const filtered = useMemo(
    () =>
      collaboratorId
        ? assignments.filter((a) => a.collaborator_id === collaboratorId)
        : assignments,
    [assignments, collaboratorId]
  );

  const byDate = useMemo(() => {
    const map: Record<string, ShiftAssignment[]> = {};
    for (const a of filtered) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [filtered]);

  const { firstDay, daysInMonth } = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const dim = new Date(year, month, 0).getDate();
    return { firstDay: first.getDay(), daysInMonth: dim };
  }, [month, year]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">
        {MONTH_NAMES[month - 1]} {year}
      </h3>

      <div className="grid grid-cols-7 gap-px bg-[#232323] rounded-xl overflow-hidden border border-[#232323]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-[#0A0A0A] text-center text-xs font-bold text-[#A1A1A1] py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const dayAssignments = dateStr ? (byDate[dateStr] ?? []) : [];

          return (
            <div
              key={i}
              onClick={() => day && dateStr && onDayClick?.(dateStr)}
              className={`bg-[#141414] min-h-[80px] p-1.5 ${!day ? "opacity-0 pointer-events-none" : onDayClick ? "cursor-pointer hover:bg-[#1A1A1A] transition-colors" : ""}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-bold ${dayAssignments.length > 0 ? "text-[#FF4D1C]" : "text-[#555]"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayAssignments.slice(0, 3).map((a, j) => (
                      <div
                        key={j}
                        className="text-[10px] bg-[#FF4D1C]/10 border border-[#FF4D1C]/20 text-[#FF6B3D] rounded px-1 py-0.5 truncate"
                        title={`${a.collaborator_name} — ${a.shift_name} ${a.start_time}`}
                      >
                        {collaboratorId ? `${a.shift_name}` : a.collaborator_name}
                      </div>
                    ))}
                    {dayAssignments.length > 3 && (
                      <div className="text-[10px] text-[#A1A1A1] px-1">+{dayAssignments.length - 3}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
