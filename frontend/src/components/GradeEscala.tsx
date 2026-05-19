"use client";
import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import type { Collaborator, ShiftAssignment } from "@/lib/api";
import { ROLE_DOT, ROLE_CHIP } from "@/lib/shifts";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface GradeEscalaProps {
  collaborators: Collaborator[];
  assignments: ShiftAssignment[];
  month: number;
  year: number;
  shiftCounts: Record<string, number>;
  onCellClick: (collaborator: Collaborator, date: string, existing: ShiftAssignment[]) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}

function loadBadge(count: number) {
  if (count === 0) return "text-[#555]";
  if (count <= 5) return "text-green-400";
  if (count <= 12) return "text-[#A1A1A1]";
  if (count <= 18) return "text-orange-400";
  return "text-red-400";
}

export function GradeEscala({
  collaborators, assignments, month, year,
  shiftCounts, onCellClick, onRemoveAssignment,
}: GradeEscalaProps) {
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // map: `${collaborator_id}|${date}` → assignments[]
  const cellMap = useMemo(() => {
    const map: Record<string, ShiftAssignment[]> = {};
    for (const a of assignments) {
      const key = `${a.collaborator_id}|${a.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assignments]);

  if (collaborators.length === 0) {
    return (
      <div className="text-center py-16 text-[#555] border border-[#232323] rounded-2xl bg-[#141414]">
        Nenhum colaborador para exibir. Ajuste os filtros ou cadastre colaboradores.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#232323]">
      <table className="border-collapse text-xs" style={{ minWidth: `${160 + daysInMonth * 52}px` }}>
        <thead>
          <tr>
            {/* Sticky name header */}
            <th className="sticky left-0 z-20 bg-[#0A0A0A] border-b border-r border-[#232323] px-3 py-2 text-left text-[#A1A1A1] font-bold uppercase tracking-wider min-w-[160px]">
              Colaborador
            </th>
            {days.map((d) => {
              const date = new Date(year, month - 1, d);
              const wd = date.getDay();
              const isWeekend = wd === 0 || wd === 6;
              return (
                <th
                  key={d}
                  className={`border-b border-l border-[#232323] px-1 py-1.5 text-center min-w-[52px] ${isWeekend ? "bg-[#0D0D0D]" : "bg-[#0A0A0A]"}`}
                >
                  <div className={`font-bold ${isWeekend ? "text-[#FF6B3D]" : "text-[#555]"}`}>
                    {WEEKDAY_SHORT[wd]}
                  </div>
                  <div className={`text-sm font-extrabold ${isWeekend ? "text-[#FF4D1C]" : "text-white"}`}>
                    {d}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {collaborators.map((collab) => {
            const count = shiftCounts[collab.id] ?? 0;
            return (
              <tr key={collab.id} className="group hover:bg-[#0D0D0D]/50">
                {/* Sticky name cell */}
                <td className="sticky left-0 z-10 bg-[#141414] group-hover:bg-[#0D0D0D] border-t border-r border-[#1E1E1E] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ROLE_DOT[collab.role] ?? "bg-gray-500"}`} />
                    <span className="font-semibold text-white truncate max-w-[110px]" title={collab.name}>
                      {collab.name}
                    </span>
                    <span className={`ml-auto font-bold tabular-nums ${loadBadge(count)}`}>
                      {count}
                    </span>
                  </div>
                </td>

                {/* Day cells */}
                {days.map((d) => {
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const cellAssignments = cellMap[`${collab.id}|${dateStr}`] ?? [];
                  const wd = new Date(year, month - 1, d).getDay();
                  const isWeekend = wd === 0 || wd === 6;

                  return (
                    <td
                      key={d}
                      className={`border-t border-l border-[#1E1E1E] align-top cursor-pointer transition-colors min-h-[44px] p-0.5 ${
                        isWeekend ? "bg-[#0D0D0D] hover:bg-[#1A1200]" : "bg-[#141414] hover:bg-[#1A1A1A]"
                      }`}
                      onClick={() => onCellClick(collab, dateStr, cellAssignments)}
                    >
                      {cellAssignments.length === 0 ? (
                        <div className="flex items-center justify-center h-10 text-[#333] group-hover:text-[#555] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={12} />
                        </div>
                      ) : (
                        <div className="space-y-0.5 py-0.5">
                          {cellAssignments.map((a) => (
                            <div
                              key={a.id}
                              className={`relative flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${ROLE_CHIP[collab.role] ?? "bg-gray-900 text-gray-300"}`}
                              title={`${a.shift_name} · ${a.start_time}–${a.end_time}`}
                            >
                              <span className="truncate">{a.start_time}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onRemoveAssignment(a.id); }}
                                className="ml-auto text-current opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
                              >
                                <X size={9} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
