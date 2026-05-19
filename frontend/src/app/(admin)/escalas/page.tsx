"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wand2, Save, Database, AlertCircle, Copy, Check,
  Search, SlidersHorizontal, ArrowUpDown,
} from "lucide-react";
import {
  api,
  type Collaborator, type ShiftAssignment,
  type ScheduleListItem, type AssignmentCreate,
} from "@/lib/api";
import { ROLE_LABEL } from "@/lib/shifts";
import { Button } from "@/components/ui/Button";
import { GradeEscala } from "@/components/GradeEscala";
import { CalendarView } from "@/components/CalendarView";
import { DayDetailPanel } from "@/components/DayDetailPanel";
import { AssignmentModal } from "@/components/AssignmentModal";
import { MetricCard } from "@/components/MetricCard";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const DEFAULT_SHIFTS = [
  { name: "Segunda (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Segunda (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { name: "Segunda (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Terça (Turno 1)",   start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Terça (Turno 2)",   start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { name: "Terça (Turno 3)",   start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quarta (Turno 1)",  start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Quarta (Turno 2)",  start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { name: "Quarta (Turno 3)",  start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Quinta (Turno 1)",  start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Quinta (Turno 2)",  start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { name: "Quinta (Turno 3)",  start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sexta (Turno 1)",   start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Sexta (Turno 2)",   start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { name: "Sexta (Turno 3)",   start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Sábado (Turno 1)",  start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { name: "Sábado (Turno 2)",  start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { name: "Domingo",           start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
];

type Tab = "grade" | "calendario" | "lista";
type RoleFilter = "todos" | "graduado" | "estagiario" | "recepcao" | "servicos_gerais";
type SortMode = "name" | "mais" | "menos";

export default function EscalasPage() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("grade");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [minShifts, setMinShifts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Panel / modal state ───────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalCell, setModalCell] = useState<{
    collaborator: Collaborator; date: string; existing: ShiftAssignment[];
  } | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadCollaborators = useCallback(() => api.collaborators.list().then(setCollaborators), []);

  const loadSchedules = useCallback(async () => {
    const list = await api.schedules.list();
    setSchedules(list);
    if (list.length > 0 && !activeScheduleId) {
      const first = list[0];
      setActiveScheduleId(first.id);
      setMonth(first.month);
      setYear(first.year);
      const full = await api.schedules.getById(first.id);
      setAssignments(full.assignments);
    }
  }, [activeScheduleId]);

  useEffect(() => {
    loadCollaborators();
    loadSchedules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchSchedule = async (id: string) => {
    const found = schedules.find((s) => s.id === id);
    if (!found) return;
    setActiveScheduleId(id);
    setMonth(found.month);
    setYear(found.year);
    const full = await api.schedules.getById(id);
    setAssignments(full.assignments);
  };

  // ── Derived: shift counts ─────────────────────────────────────────────────
  const shiftCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assignments) {
      counts[a.collaborator_id] = (counts[a.collaborator_id] ?? 0) + 1;
    }
    return counts;
  }, [assignments]);

  // ── Filtered + sorted collaborators ──────────────────────────────────────
  const visibleCollaborators = useMemo(() => {
    let list = collaborators.filter((c) => {
      if (roleFilter !== "todos" && c.role !== roleFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (minShifts > 0 && (shiftCounts[c.id] ?? 0) < minShifts) return false;
      return true;
    });
    if (sortMode === "mais") list = [...list].sort((a, b) => (shiftCounts[b.id] ?? 0) - (shiftCounts[a.id] ?? 0));
    else if (sortMode === "menos") list = [...list].sort((a, b) => (shiftCounts[a.id] ?? 0) - (shiftCounts[b.id] ?? 0));
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [collaborators, roleFilter, search, sortMode, minShifts, shiftCounts]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!collaborators.length) { setError("Cadastre colaboradores na aba Equipe primeiro."); return; }
    setError(null);
    setGenerating(true);
    try {
      const saved = await api.schedules.save({
        collaborators: collaborators.map(({ created_at: _ca, ...c }) => c),
        shifts: DEFAULT_SHIFTS,
        month, year,
      });
      setActiveScheduleId(saved.id);
      setSavedToken(saved.access_token);
      const full = await api.schedules.getById(saved.id);
      setAssignments(full.assignments);
      await loadSchedules();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await api.seed();
      await loadCollaborators();
      setActiveScheduleId(null);
      await loadSchedules();
      setMonth(6); setYear(2026);
      setError(null);
      alert(`✓ ${res.message}\n${res.collaborators} colaboradores · ${res.assignments} plantões`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddAssignment = async (data: AssignmentCreate) => {
    if (!activeScheduleId) return;
    const newA = await api.schedules.addAssignment(activeScheduleId, data);
    setAssignments((prev) => [...prev, newA]);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!activeScheduleId) return;
    await api.schedules.removeAssignment(activeScheduleId, assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  const copyLink = () => {
    if (!savedToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/escala/${savedToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const coveragePct = useMemo(() => {
    if (!assignments.length) return null;
    const total = assignments.length;
    return Math.round((total / (total)) * 100); // placeholder — adjust with unfilled when available
  }, [assignments]);

  const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "graduado", label: "Graduados" },
    { value: "estagiario", label: "Estagiários" },
    { value: "recepcao", label: "Recepção" },
    { value: "servicos_gerais", label: "Limpeza" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Escalas</h1>
          <p className="text-[#A1A1A1] mt-1">Gerencie plantões mensais da equipe.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleSeed} disabled={seeding}>
            <Database size={14} /> {seeding ? "Populando..." : "Dados de Teste"}
          </Button>
          <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
            <Wand2 size={15} /> {generating ? "Gerando..." : "Gerar Escala"}
          </Button>
        </div>
      </div>

      {/* Month/year + schedule selector */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-[#141414] border border-[#232323] rounded-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Mês</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none text-sm"
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
            className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none w-24 text-sm"
          />
        </div>
        {schedules.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Escala salva</label>
            <select
              value={activeScheduleId ?? ""}
              onChange={(e) => switchSchedule(e.target.value)}
              className="p-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none text-sm"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {MONTHS[s.month - 1]}/{s.year} · {s.assignments_count} plantões
                </option>
              ))}
            </select>
          </div>
        )}
        {savedToken && (
          <Button variant="secondary" size="sm" onClick={copyLink}>
            <Save size={13} />
            {copied ? <><Check size={13} /> Copiado</> : "Copiar link público"}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded-xl text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Metrics */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Plantões" value={assignments.length} highlight />
          <MetricCard label="Colaboradores" value={new Set(assignments.map((a) => a.collaborator_id)).size} />
          <MetricCard label="Mês" value={`${MONTHS[month - 1]}/${year}`} />
          <MetricCard label="Média/pessoa" value={collaborators.length ? Math.round(assignments.length / collaborators.length) : 0} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-[#141414] border border-[#232323] rounded-xl">
        {/* Role chips */}
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRoleFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === value
                  ? "bg-[#FF4D1C] text-white shadow-[0_0_8px_rgba(255,77,28,0.3)]"
                  : "text-[#A1A1A1] hover:bg-[#232323] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full pl-8 pr-3 py-2 bg-[#0A0A0A] border border-[#232323] rounded-lg text-sm text-white placeholder:text-[#555] focus:ring-2 focus:ring-[#FF6B3D] outline-none"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={13} className="text-[#555]" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="py-2 px-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-xs text-white focus:ring-2 focus:ring-[#FF6B3D] outline-none"
          >
            <option value="name">A-Z</option>
            <option value="mais">Mais plantões</option>
            <option value="menos">Menos plantões</option>
          </select>
        </div>

        {/* Min shifts */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-[#555]" />
          <input
            type="number"
            min={0}
            value={minShifts}
            onChange={(e) => setMinShifts(Number(e.target.value))}
            title="Mínimo de plantões"
            placeholder="≥ plantões"
            className="w-24 py-2 px-2.5 bg-[#0A0A0A] border border-[#232323] rounded-lg text-xs text-white placeholder:text-[#555] focus:ring-2 focus:ring-[#FF6B3D] outline-none"
          />
        </div>

        <span className="text-xs text-[#555] ml-auto">
          {visibleCollaborators.length} de {collaborators.length}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#232323] pb-1">
        {(["grade", "calendario", "lista"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all capitalize ${
              tab === t
                ? "bg-[#FF4D1C] text-white shadow-[0_0_10px_rgba(255,77,28,0.2)]"
                : "text-[#A1A1A1] hover:bg-[#232323] hover:text-white"
            }`}
          >
            {t === "grade" ? "Grade" : t === "calendario" ? "Calendário" : "Lista"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "grade" && (
        <GradeEscala
          collaborators={visibleCollaborators}
          assignments={assignments}
          month={month}
          year={year}
          shiftCounts={shiftCounts}
          onCellClick={(collab, date, existing) => setModalCell({ collaborator: collab, date, existing })}
          onRemoveAssignment={handleRemoveAssignment}
        />
      )}

      {tab === "calendario" && (
        <div>
          <CalendarView
            month={month}
            year={year}
            assignments={assignments.filter((a) => {
              if (roleFilter === "todos") return true;
              const c = collaborators.find((x) => x.id === a.collaborator_id);
              return c?.role === roleFilter;
            })}
            onDayClick={(date) => setSelectedDay(date)}
          />
          <p className="text-xs text-[#555] mt-2 text-center">Clique em um dia para ver os detalhes.</p>
        </div>
      )}

      {tab === "lista" && (
        assignments.length === 0 ? (
          <div className="text-center py-16 text-[#555] border border-[#232323] rounded-2xl bg-[#141414]">
            Nenhum plantão. Gere uma escala primeiro.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#232323]">
            <table className="w-full text-sm">
              <thead className="bg-[#0A0A0A] border-b border-[#232323]">
                <tr>
                  {["Data", "Colaborador", "Função", "Turno", "Entrada", "Saída"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-[#141414] divide-y divide-[#1E1E1E]">
                {assignments
                  .filter((a) => {
                    const c = collaborators.find((x) => x.id === a.collaborator_id);
                    if (roleFilter !== "todos" && c?.role !== roleFilter) return false;
                    if (search && !a.collaborator_name.toLowerCase().includes(search.toLowerCase())) return false;
                    return true;
                  })
                  .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                  .map((a, i) => {
                    const c = collaborators.find((x) => x.id === a.collaborator_id);
                    return (
                      <tr key={i} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="px-4 py-3 text-[#A1A1A1]">{a.date}</td>
                        <td className="px-4 py-3 font-semibold text-white">{a.collaborator_name}</td>
                        <td className="px-4 py-3 text-[#A1A1A1]">{ROLE_LABEL[c?.role ?? ""] ?? c?.role}</td>
                        <td className="px-4 py-3 text-[#A1A1A1]">{a.shift_name}</td>
                        <td className="px-4 py-3 text-white">{a.start_time}</td>
                        <td className="px-4 py-3 text-white">{a.end_time}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Day detail panel (calendario tab) */}
      <DayDetailPanel
        date={selectedDay}
        assignments={assignments}
        collaborators={collaborators}
        scheduleId={activeScheduleId}
        onClose={() => setSelectedDay(null)}
        onRemove={handleRemoveAssignment}
        onAdd={handleAddAssignment}
      />

      {/* Assignment modal (grade tab) */}
      {modalCell && (
        <AssignmentModal
          open={!!modalCell}
          collaborator={modalCell.collaborator}
          date={modalCell.date}
          existing={modalCell.existing}
          scheduleId={activeScheduleId}
          onClose={() => setModalCell(null)}
          onAdd={async (data) => { await handleAddAssignment(data); setModalCell(null); }}
          onRemove={async (id) => {
            await handleRemoveAssignment(id);
            setModalCell((prev) =>
              prev ? { ...prev, existing: prev.existing.filter((a) => a.id !== id) } : null
            );
          }}
        />
      )}
    </div>
  );
}
