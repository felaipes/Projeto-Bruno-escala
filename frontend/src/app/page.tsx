"use client";
import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

type Collaborator = {
  id: string;
  name: string;
  role: string;
  block_saturday_1: boolean;
};

type Shift = {
  id: string;
  name: string;
  start_time: string;
  required_graduados: number;
  required_estagiarios: number;
};

type ShiftAssignment = {
  shift_id: string;
  collaborator_id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type ScheduleResult = {
  assignments: ShiftAssignment[];
  unfilled_shifts: any[];
  shift_counts: Record<string, number>;
};

const defaultShifts: Shift[] = [
  { id: 'seg1', name: 'Segunda (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'seg2', name: 'Segunda (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'seg3', name: 'Segunda (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'ter1', name: 'Terça (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'ter2', name: 'Terça (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'ter3', name: 'Terça (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qua1', name: 'Quarta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qua2', name: 'Quarta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qua3', name: 'Quarta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qui1', name: 'Quinta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qui2', name: 'Quinta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'qui3', name: 'Quinta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'sex1', name: 'Sexta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'sex2', name: 'Sexta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'sex3', name: 'Sexta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 's1', name: 'Sábado (Turno 1)', start_time: '08:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 's2', name: 'Sábado (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1 },
  { id: 'dom', name: 'Domingo', start_time: '08:00', required_graduados: 1, required_estagiarios: 1 },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [module, setModule] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Professores');

  // Team State
  const [team, setTeam] = useState<Collaborator[]>([
    { id: '1', name: 'Prof. Silva', role: 'graduado', block_saturday_1: false },
    { id: '2', name: 'Prof. Souza', role: 'graduado', block_saturday_1: false },
    { id: '3', name: 'Est. João', role: 'estagiario', block_saturday_1: false },
    { id: '4', name: 'Est. Maria', role: 'estagiario', block_saturday_1: false },
  ]);

  // Shifts State
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);

  // Result State
  const [result, setResult] = useState<ScheduleResult | null>(null);

  const handleNext = async () => {
    if (step === 3) {
      // Generate Schedule
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/schedule/type-1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaborators: team, shifts }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Erro ao gerar escala.');
        }

        const data = await response.json();
        setResult(data);
        setStep(4);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setError(null);
  };

  const addCollaborator = () => {
    setTeam([...team, { id: Date.now().toString(), name: '', role: 'graduado', block_saturday_1: false }]);
  };

  const removeCollaborator = (id: string) => {
    setTeam(team.filter((c) => c.id !== id));
  };

  const updateCollaborator = (id: string, field: keyof Collaborator, value: any) => {
    setTeam(team.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateShift = (id: string, field: keyof Shift, value: any) => {
    setShifts(shifts.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // TanStack Table setup
  const columnHelper = createColumnHelper<ShiftAssignment>();
  const columns = useMemo(() => [
    columnHelper.accessor('date', { header: 'Dia da Semana' }),
    columnHelper.accessor((row) => team.find((c) => c.id === row.collaborator_id)?.name || 'Desconhecido', {
      id: 'name',
      header: 'Colaborador',
    }),
    columnHelper.accessor((row) => team.find((c) => c.id === row.collaborator_id)?.role || '', {
      id: 'role',
      header: 'Função',
    }),
    columnHelper.accessor('start_time', { header: 'Entrada' }),
    columnHelper.accessor('end_time', { header: 'Saída' }),
  ], [team]);

  const filteredAssignments = useMemo(() => {
    return (result?.assignments || []).filter(assignment => {
      const role = team.find((c) => c.id === assignment.collaborator_id)?.role || '';
      if (activeTab === 'Professores') return role === 'graduado' || role === 'estagiario';
      if (activeTab === 'Recepção') return role === 'recepcao';
      if (activeTab === 'Limpeza') return role === 'servicos_gerais' || role === 'limpeza';
      return true;
    });
  }, [result?.assignments, activeTab, team]);

  const table = useReactTable({
    data: filteredAssignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 font-sans text-[#FFFFFF]">
      <div className="bg-[#141414] border border-[#232323] rounded-2xl shadow-2xl p-8 max-w-5xl w-full">
        <h1 className="text-3xl font-extrabold text-[#FFFFFF] mb-8 text-center tracking-tight">
          Escala Certa<span className="text-[#FF4D1C]">.net</span>
        </h1>

        {/* Wizard Progress */}
        <div className="flex justify-between items-center mb-10 border-b border-[#232323] pb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= i ? 'bg-[#FF4D1C] text-[#FFFFFF] shadow-[0_0_10px_#FF6B3D]' : 'bg-[#0A0A0A] border border-[#232323] text-[#A1A1A1]'}`}>
                {i}
              </div>
              {i < 4 && <div className={`w-24 h-1 mx-2 transition-colors duration-300 ${step > i ? 'bg-[#FF4D1C]' : 'bg-[#232323]'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-[#FFFFFF]">1. Selecione o Tipo de Escala</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Professores', 'Recepção', 'Serviços Gerais', 'Feriados'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setModule(mod)}
                  className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${module === mod ? 'border-[#FF4D1C] bg-[#FF4D1C]/10 shadow-[0_0_15px_rgba(255,107,61,0.15)]' : 'border-[#232323] hover:border-[#FF6B3D] hover:bg-[#0A0A0A]'}`}
                >
                  <p className={`font-semibold text-lg ${module === mod ? 'text-[#FF4D1C]' : 'text-[#FFFFFF]'}`}>{mod}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#FFFFFF]">2. Equipe e Restrições</h2>
                <p className="text-[#A1A1A1] mt-1">Regra do Asterisco (*): Marque quem não pode no Sábado 1.</p>
              </div>
              <button onClick={addCollaborator} className="flex items-center gap-2 bg-[#FF4D1C] text-[#FFFFFF] px-4 py-2 rounded-lg hover:bg-[#FF6B3D] transition shadow-[0_0_10px_rgba(255,107,61,0.2)]">
                <Plus size={18} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {team.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-4 border border-[#232323] bg-[#0A0A0A] rounded-xl">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCollaborator(c.id, 'name', e.target.value)}
                    placeholder="Nome"
                    className="flex-1 p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] focus:ring-2 focus:ring-[#FF6B3D] outline-none"
                  />
                  <select
                    value={c.role}
                    onChange={(e) => updateCollaborator(c.id, 'role', e.target.value)}
                    className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] focus:ring-2 focus:ring-[#FF6B3D] outline-none"
                  >
                    <option value="graduado">Professor - Graduado (6h)</option>
                    <option value="estagiario">Professor - Estagiário (5h)</option>
                    <option value="recepcao">Recepção (6h)</option>
                    <option value="servicos_gerais">Limpeza/Serviços Gerais (6h)</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#141414] px-3 py-2.5 border border-[#232323] rounded-lg">
                    <input
                      type="checkbox"
                      checked={c.block_saturday_1}
                      onChange={(e) => updateCollaborator(c.id, 'block_saturday_1', e.target.checked)}
                      className="w-4 h-4 text-[#FF4D1C] rounded border-[#232323] bg-[#0A0A0A] focus:ring-[#FF6B3D] focus:ring-offset-[#141414]"
                    />
                    <span className="text-sm font-medium text-[#A1A1A1]">Bloquear Sáb 1 (*)</span>
                  </label>
                  <button onClick={() => removeCollaborator(c.id)} className="p-2 text-red-500 hover:bg-red-950/30 rounded-lg transition">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-[#FFFFFF]">3. Configuração de Horários e Dias da Semana</h2>
            <p className="text-[#A1A1A1]">Defina os inícios por dia. Os términos são somados por função.</p>
            
            <div className="grid gap-4">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center gap-6 p-5 border border-[#232323] bg-[#0A0A0A] rounded-xl">
                  <div className="w-32 font-semibold text-[#FFFFFF]">{s.name}</div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block">Início</label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateShift(s.id, 'start_time', e.target.value)}
                      className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block">Graduados Req.</label>
                    <input
                      type="number"
                      min="0"
                      value={s.required_graduados}
                      onChange={(e) => updateShift(s.id, 'required_graduados', parseInt(e.target.value) || 0)}
                      className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block">Estagiários Req.</label>
                    <input
                      type="number"
                      min="0"
                      value={s.required_estagiarios}
                      onChange={(e) => updateShift(s.id, 'required_estagiarios', parseInt(e.target.value) || 0)}
                      className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-bold text-[#FFFFFF]">4. Escala Gerada</h2>
              <p className="text-[#A1A1A1]">Resultados otimizados com distribuição Round-Robin</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-[#232323] pb-4">
              {['Professores', 'Recepção', 'Limpeza'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-[#FF4D1C] text-[#FFFFFF] shadow-[0_0_10px_rgba(255,107,61,0.2)]'
                      : 'text-[#A1A1A1] hover:bg-[#232323] hover:text-[#FFFFFF]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Metrics */}
            <div className="flex gap-4 mb-6">
              <div className="p-4 rounded-xl border border-[#FF4D1C]/20 bg-[#FF4D1C]/5 flex-1">
                <p className="text-sm font-semibold text-[#FF6B3D] mb-2 uppercase tracking-wider">Plantões por Pessoa</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.shift_counts).map(([id, count]) => {
                    const c = team.find(x => x.id === id);
                    return c ? (
                      <span key={id} className="bg-[#141414] px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-[#232323] text-[#FFFFFF]">
                        {c.name}: <span className="text-[#FF4D1C]">{count}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Unfilled warnings */}
            {result.unfilled_shifts && result.unfilled_shifts.length > 0 && (
              <div className="p-4 bg-orange-950/30 border border-orange-900/50 text-orange-400 rounded-xl mb-6">
                <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={18} /> Atenção: Faltam colaboradores</p>
                <ul className="list-disc pl-5 text-sm space-y-1 text-orange-300/80">
                  {result.unfilled_shifts.map((u, idx) => (
                    <li key={idx}>
                      Faltam {u.missing} {u.role}(s) no dia/turno {shifts.find(s => s.id === u.shift_id)?.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-[#232323] shadow-lg">
              <table className="min-w-full divide-y divide-[#232323]">
                <thead className="bg-[#0A0A0A]">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 text-left text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-[#141414] divide-y divide-[#232323]">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-[#232323]/40 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-[#FFFFFF] font-medium">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {table.getRowModel().rows.length === 0 && (
              <div className="p-8 text-center text-[#A1A1A1] bg-[#0A0A0A] rounded-xl border border-[#232323]">
                Nenhum plantão foi alocado. Verifique as configurações.
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex justify-between border-t border-[#232323] pt-6">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className="px-6 py-3 rounded-xl font-bold text-[#A1A1A1] bg-[#0A0A0A] border border-[#232323] hover:bg-[#232323] transition-colors disabled:opacity-40 disabled:hover:bg-[#0A0A0A]"
          >
            Voltar
          </button>
          <button 
            onClick={handleNext} 
            disabled={(step === 1 && !module) || (step === 4)}
            className={`px-8 py-3 rounded-xl font-bold text-[#FFFFFF] transition-all shadow-[0_0_15px_rgba(255,107,61,0.2)] hover:shadow-[0_0_20px_rgba(255,107,61,0.4)] ${
              step === 4 ? 'hidden' : 
              'bg-[#FF4D1C] hover:bg-[#FF6B3D] disabled:opacity-50 disabled:hover:bg-[#FF4D1C] disabled:shadow-none'
            }`}
          >
            {step === 3 ? 'Gerar Escala Magicamente' : 'Avançar'}
          </button>
        </div>
      </div>
    </main>
  );
}
