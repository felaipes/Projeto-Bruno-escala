"use client";
import { useEffect, useState } from "react";
import { Users, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { api, type Collaborator, type ScheduleResult } from "@/lib/api";
import { MetricCard } from "@/components/MetricCard";

export default function DashboardPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [lastResult, setLastResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.collaborators.list().then(setCollaborators).finally(() => setLoading(false));

    const stored = sessionStorage.getItem("lastScheduleResult");
    if (stored) setLastResult(JSON.parse(stored));
  }, []);

  const totalAssignments = lastResult?.assignments.length ?? 0;
  const unfilledCount = lastResult?.unfilled_shifts.length ?? 0;

  const roleLabels: Record<string, string> = {
    graduado: "Graduados",
    estagiario: "Estagiários",
    recepcao: "Recepção",
    servicos_gerais: "Serv. Gerais",
  };

  const byRole = collaborators.reduce<Record<string, number>>((acc, c) => {
    acc[c.role] = (acc[c.role] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#A1A1A1]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
        <p className="text-[#A1A1A1] mt-1">Visão geral da equipe e das escalas.</p>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Colaboradores" value={collaborators.length} icon={<Users size={18} />} />
        <MetricCard label="Plantões gerados" value={totalAssignments} icon={<Calendar size={18} />} highlight={totalAssignments > 0} />
        <MetricCard label="Turnos incompletos" value={unfilledCount} icon={<AlertTriangle size={18} />} highlight={unfilledCount > 0} />
        <MetricCard label="Cobertura" value={totalAssignments > 0 ? `${Math.round(((totalAssignments) / (totalAssignments + unfilledCount)) * 100)}%` : "—"} icon={<CheckCircle size={18} />} />
      </div>

      {/* Team breakdown */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Composição da Equipe</h2>
        {collaborators.length === 0 ? (
          <div className="text-center py-10 text-[#555]">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum colaborador cadastrado.</p>
            <p className="text-sm mt-1">Acesse <strong className="text-[#FF4D1C]">Equipe</strong> para adicionar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(byRole).map(([role, count]) => (
              <div key={role} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E]">
                <p className="text-xs text-[#A1A1A1] uppercase tracking-wider font-semibold mb-1">
                  {roleLabels[role] ?? role}
                </p>
                <p className="text-2xl font-extrabold text-white">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shift counts from last schedule */}
      {lastResult && Object.keys(lastResult.shift_counts).length > 0 && (
        <div className="bg-[#141414] border border-[#232323] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Plantões por Colaborador</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(lastResult.shift_counts).map(([id, count]) => {
              const c = collaborators.find((x) => x.id === id);
              return c ? (
                <span key={id} className="bg-[#0A0A0A] border border-[#232323] px-3 py-1.5 rounded-full text-sm font-medium text-white">
                  {c.name}: <span className="text-[#FF4D1C] font-bold">{count}</span>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
