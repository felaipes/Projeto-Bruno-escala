"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { api, type Collaborator } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const ROLES = [
  { value: "graduado", label: "Professor Graduado (6h)" },
  { value: "estagiario", label: "Professor Estagiário (5h)" },
  { value: "recepcao", label: "Recepção (6h)" },
  { value: "servicos_gerais", label: "Serviços Gerais (6h)" },
];

const ROLE_LABELS: Record<string, string> = {
  graduado: "Graduado",
  estagiario: "Estagiário",
  recepcao: "Recepção",
  servicos_gerais: "Serv. Gerais",
};

const ROLE_COLORS: Record<string, string> = {
  graduado: "bg-blue-950/40 text-blue-400 border border-blue-900/30",
  estagiario: "bg-purple-950/40 text-purple-400 border border-purple-900/30",
  recepcao: "bg-green-950/40 text-green-400 border border-green-900/30",
  servicos_gerais: "bg-yellow-950/40 text-yellow-400 border border-yellow-900/30",
};

type FormData = Omit<Collaborator, "id" | "created_at">;
const emptyForm = (): FormData => ({ name: "", role: "graduado", block_saturday_1: false });

export default function EquipePage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.collaborators.list().then(setCollaborators).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (c: Collaborator) => { setEditing(c); setForm({ name: c.name, role: c.role, block_saturday_1: c.block_saturday_1 }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.collaborators.update(editing.id, form);
      } else {
        await api.collaborators.create(form);
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este colaborador?")) return;
    try {
      await api.collaborators.remove(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Equipe</h1>
          <p className="text-[#A1A1A1] mt-1">Gerencie os colaboradores e suas restrições.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#555]">Carregando...</div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-16 text-[#555] border border-[#232323] rounded-2xl bg-[#141414]">
          <Users size={44} className="mx-auto mb-3 opacity-20" />
          <p className="text-lg font-semibold text-[#A1A1A1]">Nenhum colaborador cadastrado</p>
          <p className="text-sm mt-1">Clique em Adicionar para começar.</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#232323] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-[#232323]">
              <tr>
                {["Nome", "Função", "Bloq. Sáb 1", "Ações"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]">
              {collaborators.map((c) => (
                <tr key={c.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-white">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[c.role] ?? "bg-[#232323] text-[#A1A1A1]"}`}>
                      {ROLE_LABELS[c.role] ?? c.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.block_saturday_1 ? (
                      <span className="text-xs font-bold text-orange-400 bg-orange-950/30 border border-orange-900/30 px-2.5 py-1 rounded-full">Sim *</span>
                    ) : (
                      <span className="text-xs text-[#555]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Colaborador" : "Novo Colaborador"}>
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Prof. Silva" />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Função</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none"
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#232323] rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] transition">
            <input
              type="checkbox"
              checked={form.block_saturday_1}
              onChange={(e) => setForm({ ...form, block_saturday_1: e.target.checked })}
              className="w-4 h-4 rounded border-[#232323] bg-[#0A0A0A] text-[#FF4D1C] focus:ring-[#FF6B3D]"
            />
            <span className="text-sm text-[#A1A1A1]">Bloqueado para Sábado 1 <span className="text-[#FF4D1C]">(*)</span></span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
