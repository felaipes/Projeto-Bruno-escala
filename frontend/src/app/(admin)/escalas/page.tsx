"use client";
import { useEffect, useState } from "react";
import { Wand2, Save, AlertCircle, Copy, Check } from "lucide-react";
import { api, type Collaborator, type Shift, type ScheduleResult, type ShiftAssignment } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { CalendarView } from "@/components/CalendarView";
import { MetricCard } from "@/components/MetricCard";

const DEFAULT_SHIFTS: Omit<Shift, "id" | "created_at">[] = [
  { name: "Segunda (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Segunda (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Segunda (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Terça (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Terça (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Terça (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quarta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quarta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quarta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quinta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quinta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quinta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sexta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sexta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sexta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sábado (Turno 1)", start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sábado (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Domingo", start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
];

const TABS = ["Professores", "Recepção", "Limpeza", "Calendário"];

export default function EscalasPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [activeTab, setActiveTab] = useState("Professores");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.collaborators.list().then(setCollaborators);
    const stored = sessionStorage.getItem("lastScheduleResult");
    if (stored) setResult(JSON.parse(stored));
  }, []);

  const handleGenerate = async () => {
    if (collaborators.length === 0) { setError("Cadastre colaboradores primeiro."); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await api.schedules.generate({
        collaborators: collaborators.map(({ id: _id, created_at: _ca, ...c }) => c),
        shifts: DEFAULT_SHIFTS,
        month,
        year,
      });
      setResult(res);
      sessionStorage.setItem("lastScheduleResult", JSON.stringify(res));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || collaborators.length === 0) return;
    setSaving(true);
    try {
      const res = await api.schedules.save({
        collaborators: collaborators.map(({ id: _id, created_at: _ca, ...c }) => c),
        shifts: DEFAULT_SHIFTS,
        month,
        year,
      });
      setSavedToken(res.access_token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!savedToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/escala/${savedToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredAssignments: ShiftAssignment[] = (result?.assignments ?? []).filter((a) => {
    const role = collaborators.find((c) => c.id === a.collaborator_id)?.role ?? "";
    if (activeTab === "Professores") return role === "graduado" || role === "estagiario";
    if (activeTab === "Recepção") return role === "recepcao";
    if (activeTab === "Limpeza") return role === "servicos_gerais";
    return true;
  });

  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Escalas</h1>
        <p className="text-[#A1A1A1] mt-1">Gere e exporte a escala mensal da equipe.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 p-5 bg-[#141414] border border-[#232323] rounded-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Mês</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none w-24"
          />
        </div>
        <Button onClick={handleGenerate} disabled={generating} size="lg">
          <Wand2 size={18} /> {generating ? "Gerando..." : "Gerar Escala"}
        </Button>
        {result && (
          <Button variant="secondary" size="lg" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? "Salvando..." : "Salvar e Publicar"}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded-xl">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Published link */}
      {savedToken && (
        <div className="flex items-center gap-3 p-4 bg-green-950/30 border border-green-900/40 text-green-400 rounded-xl text-sm">
          <Check size={18} />
          <span>Escala publicada!</span>
          <code className="flex-1 truncate text-green-300">{`${typeof window !== "undefined" ? window.location.origin : ""}/escala/${savedToken}`}</code>
          <Button variant="ghost" size="sm" onClick={copyLink}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </div>
      )}

      {result && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total de plantões" value={result.assignments.length} highlight />
            <MetricCard label="Turnos incompletos" value={result.unfilled_shifts.length} />
            <MetricCard label="Mês" value={`${MONTHS[month - 1]}/${year}`} />
            <MetricCard label="Colaboradores" value={collaborators.length} />
          </div>

          {/* Unfilled warning */}
          {result.unfilled_shifts.length > 0 && (
            <div className="p-4 bg-orange-950/30 border border-orange-900/40 text-orange-400 rounded-xl">
              <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={18} /> Turnos sem cobertura</p>
              <ul className="list-disc pl-5 text-sm space-y-1 text-orange-300/80">
                {result.unfilled_shifts.map((u, i) => (
                  <li key={i}>{u.date} · {u.shift_name} · faltam {u.missing} {u.role}(s)</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#232323] pb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  activeTab === tab
                    ? "bg-[#FF4D1C] text-white shadow-[0_0_10px_rgba(255,77,28,0.2)]"
                    : "text-[#A1A1A1] hover:bg-[#232323] hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Calendário" ? (
            <CalendarView month={month} year={year} assignments={result.assignments} />
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-[#555] border border-[#232323] rounded-2xl bg-[#141414]">
              Nenhum plantão nesta categoria.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#232323]">
              <table className="w-full">
                <thead className="bg-[#0A0A0A] border-b border-[#232323]">
                  <tr>
                    {["Data", "Colaborador", "Turno", "Entrada", "Saída"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#141414] divide-y divide-[#1E1E1E]">
                  {filteredAssignments.map((a, i) => (
                    <tr key={i} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="px-5 py-3 text-sm text-[#A1A1A1]">{a.date}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-white">{a.collaborator_name}</td>
                      <td className="px-5 py-3 text-sm text-[#A1A1A1]">{a.shift_name}</td>
                      <td className="px-5 py-3 text-sm text-white">{a.start_time}</td>
                      <td className="px-5 py-3 text-sm text-white">{a.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!result && !generating && (
        <div className="text-center py-16 text-[#555] border border-[#232323] rounded-2xl bg-[#141414]">
          <Wand2 size={44} className="mx-auto mb-3 opacity-20" />
          <p className="text-lg font-semibold text-[#A1A1A1]">Nenhuma escala gerada ainda</p>
          <p className="text-sm mt-1">Selecione o mês e clique em Gerar Escala.</p>
        </div>
      )}
    </div>
  );
}
