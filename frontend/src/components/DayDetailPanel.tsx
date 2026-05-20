"use client";
import { useState, useMemo } from "react";
import { X, Plus, Clock } from "lucide-react";
import type { Collaborator, ShiftAssignment, AssignmentCreate } from "@/lib/api";
import { ROLE_COLOR, ROLE_LABEL, ROLE_DOT, getTemplatesForDate } from "@/lib/shifts";
import { Button } from "@/components/ui/Button";

const WEEKDAY_PT = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const MONTH_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface DayDetailPanelProps {
  date: string | null;           // "YYYY-MM-DD"
  assignments: ShiftAssignment[];
  collaborators: Collaborator[];
  scheduleId: string | null;
  onClose: () => void;
  onRemove: (assignmentId: string) => Promise<void>;
  onAdd: (data: AssignmentCreate) => Promise<void>;
}

type RoleFilter = "todos" | "graduado" | "estagiario" | "recepcao" | "servicos_gerais";

export function DayDetailPanel({
  date, assignments, collaborators, scheduleId,
  onClose, onRemove, onAdd,
}: DayDetailPanelProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCollabId, setAddCollabId] = useState("");
  const [addShiftId, setAddShiftId] = useState("");
  const [saving, setSaving] = useState(false);

  const dayAssignments = useMemo(() => {
    if (!date) return [];
    return assignments
      .filter((a) => a.date === date)
      .filter((a) => {
        if (roleFilter === "todos") return true;
        const collab = collaborators.find((c) => c.id === a.collaborator_id);
        return collab?.role === roleFilter;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [date, assignments, roleFilter, collaborators]);

  const templates = useMemo(() => date ? getTemplatesForDate(date) : [], [date]);

  const handleAdd = async () => {
    if (!addCollabId || !addShiftId || !scheduleId || !date) return;
    const collab = collaborators.find((c) => c.id === addCollabId)!;
    const tmpl = templates.find((t) => t.id === addShiftId)!;
    setSaving(true);
    try {
      await onAdd({
        collaborator_id: collab.id, collaborator_name: collab.name,
        shift_id: tmpl.id, shift_name: tmpl.name,
        date, start_time: tmpl.start_time, end_time: tmpl.end_time,
      });
      setShowAddForm(false);
      setAddCollabId("");
      setAddShiftId("");
    } finally {
      setSaving(false);
    }
  };

  if (!date) return null;

  const d = new Date(date + "T12:00:00");
  const dayLabel = `${WEEKDAY_PT[d.getDay()]}, ${d.getDate()} de ${MONTH_PT[d.getMonth()]} ${d.getFullYear()}`;

  const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "graduado", label: "Graduados" },
    { value: "estagiario", label: "Estagiários" },
    { value: "recepcao", label: "Recepção" },
    { value: "servicos_gerais", label: "Limpeza" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#141414] border-l border-[#232323] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#232323]">
          <div>
            <p className="text-xs text-[#A1A1A1] uppercase tracking-wider font-semibold">Plantões do dia</p>
            <h3 className="text-base font-bold text-white mt-0.5">{dayLabel}</h3>
            <p className="text-sm text-[#A1A1A1] mt-0.5">
              {dayAssignments.length === 0 ? "Nenhum plantão" : `${dayAssignments.length} plantão(ões)`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#A1A1A1] hover:text-white hover:bg-[#232323] rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Role filters */}
        <div className="flex gap-1.5 p-3 border-b border-[#232323] flex-wrap">
          {ROLE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRoleFilter(value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                roleFilter === value
                  ? "bg-[#FF4D1C] text-white"
                  : "text-[#A1A1A1] hover:bg-[#232323] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Assignment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {dayAssignments.length === 0 ? (
            <div className="text-center py-10 text-[#555]">
              <Clock size={32} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum plantão nesta categoria.</p>
            </div>
          ) : (
            dayAssignments.map((a) => {
              const collab = collaborators.find((c) => c.id === a.collaborator_id);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl group">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ROLE_DOT[collab?.role ?? ""] ?? "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.collaborator_name}</p>
                    <p className="text-xs text-[#A1A1A1]">{a.shift_name}</p>
                    <p className="text-xs text-[#555]">{a.start_time} – {a.end_time}</p>
                  </div>
                  {collab && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[collab.role] ?? ""}`}>
                      {ROLE_LABEL[collab.role]}
                    </span>
                  )}
                  {scheduleId && (
                    <button
                      onClick={() => onRemove(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-950/30 rounded-lg transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add assignment */}
        {scheduleId && (
          <div className="p-4 border-t border-[#232323]">
            {!showAddForm ? (
              <Button variant="secondary" className="w-full justify-center" onClick={() => setShowAddForm(true)}>
                <Plus size={14} /> Adicionar plantão
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Colaborador</label>
                  <select
                    value={addCollabId}
                    onChange={(e) => setAddCollabId(e.target.value)}
                    className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none"
                  >
                    <option value="">Selecione...</option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Turno</label>
                  <select
                    value={addShiftId}
                    onChange={(e) => setAddShiftId(e.target.value)}
                    className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none"
                  >
                    <option value="">Selecione...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} · {t.start_time}–{t.end_time}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                  <Button size="sm" className="flex-1 justify-center" onClick={handleAdd} disabled={!addCollabId || !addShiftId || saving}>
                    {saving ? "..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
