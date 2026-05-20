"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Collaborator, ShiftAssignment, AssignmentCreate } from "@/lib/api";
import { getTemplatesForDate, ROLE_LABEL, ROLE_COLOR } from "@/lib/shifts";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AssignmentModalProps {
  open: boolean;
  collaborator: Collaborator | null;
  date: string | null;
  existing: ShiftAssignment[];
  scheduleId: string | null;
  onClose: () => void;
  onAdd: (data: AssignmentCreate) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}

export function AssignmentModal({
  open, collaborator, date, existing, scheduleId,
  onClose, onAdd, onRemove,
}: AssignmentModalProps) {
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const templates = date ? getTemplatesForDate(date) : [];

  const d = date ? new Date(date + "T12:00:00") : null;
  const dateLabel = d
    ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
    : "";

  const handleAdd = async () => {
    if (!selectedShiftId || !collaborator || !date || !scheduleId) return;
    const tmpl = templates.find((t) => t.id === selectedShiftId)!;
    setSaving(true);
    try {
      await onAdd({
        collaborator_id: collaborator.id,
        collaborator_name: collaborator.name,
        shift_id: tmpl.id,
        shift_name: tmpl.name,
        date,
        start_time: tmpl.start_time,
        end_time: tmpl.end_time,
      });
      setSelectedShiftId("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await onRemove(id);
    } finally {
      setRemoving(null);
    }
  };

  if (!collaborator || !date) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${collaborator.name} · ${dateLabel}`}
    >
      <div className="space-y-5">
        {/* Role badge */}
        <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[collaborator.role] ?? ""}`}>
          {ROLE_LABEL[collaborator.role] ?? collaborator.role}
        </span>

        {/* Existing assignments */}
        {existing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Plantões neste dia</p>
            {existing.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{a.shift_name}</p>
                  <p className="text-xs text-[#A1A1A1]">{a.start_time} – {a.end_time}</p>
                </div>
                {scheduleId && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(a.id)}
                    disabled={removing === a.id}
                  >
                    <Trash2 size={13} />
                    {removing === a.id ? "..." : "Remover"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        {scheduleId && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">
              {existing.length > 0 ? "Adicionar outro turno" : "Atribuir turno"}
            </p>
            {templates.length === 0 ? (
              <p className="text-sm text-[#555]">Nenhum turno disponível para este dia.</p>
            ) : (
              <>
                <div className="grid gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedShiftId(t.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedShiftId === t.id
                          ? "border-[#FF4D1C] bg-[#FF4D1C]/10 text-white"
                          : "border-[#232323] bg-[#0A0A0A] text-[#A1A1A1] hover:border-[#FF6B3D] hover:text-white"
                      }`}
                    >
                      <span className="text-sm font-semibold">{t.name}</span>
                      <span className="text-xs text-[#555]">{t.start_time} – {t.end_time}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                  <Button onClick={handleAdd} disabled={!selectedShiftId || saving}>
                    {saving ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {!scheduleId && existing.length === 0 && (
          <p className="text-sm text-[#555] text-center py-4">Nenhum plantão neste dia.</p>
        )}
      </div>
    </Modal>
  );
}
