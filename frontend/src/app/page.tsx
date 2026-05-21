"use client";
import { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, Home, Calendar } from 'lucide-react';

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
  required_recepcao: number;
  required_servicos_gerais: number;
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
  { id: 'seg1', name: 'Segunda (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'seg2', name: 'Segunda (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'seg3', name: 'Segunda (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'ter1', name: 'Terça (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'ter2', name: 'Terça (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'ter3', name: 'Terça (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qua1', name: 'Quarta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qua2', name: 'Quarta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qua3', name: 'Quarta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qui1', name: 'Quinta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qui2', name: 'Quinta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'qui3', name: 'Quinta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'sex1', name: 'Sexta (Turno 1)', start_time: '05:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'sex2', name: 'Sexta (Turno 2)', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'sex3', name: 'Sexta (Turno 3)', start_time: '17:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 's1', name: 'Sábado 1', start_time: '08:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 's2', name: 'Sábado 2', start_time: '11:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
  { id: 'dom', name: 'Domingo', start_time: '08:00', required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 1 },
];

const PROFESSIONAL_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-violet-500'
];

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Professores');

  // Team State
  const [team, setTeam] = useState<Collaborator[]>([
    { id: '1', name: 'Prof. Silva', role: 'graduado', block_saturday_1: false },
    { id: '2', name: 'Prof. Souza', role: 'graduado', block_saturday_1: false },
    { id: '3', name: 'Est. João', role: 'estagiario', block_saturday_1: false },
    { id: '4', name: 'Est. Maria', role: 'estagiario', block_saturday_1: false },
    { id: '5', name: 'Rec. Ana', role: 'recepcao', block_saturday_1: false },
    { id: '6', name: 'Limp. Carlos', role: 'servicos_gerais', block_saturday_1: false },
  ]);

  // Shifts State
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);

  // Result State
  const [result, setResult] = useState<ScheduleResult | null>(null);

  const teamColorMap = useMemo(() => {
    const map = new Map<string, string>();
    team.forEach((member, index) => {
      map.set(member.id, PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length]);
    });
    return map;
  }, [team]);

  const handleNext = async () => {
    if (step === 2) {
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
        setStep(3);
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

  const restartProcess = () => {
    setStep(1);
    setResult(null);
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

  const filteredAssignments = useMemo(() => {
    return (result?.assignments || []).filter(assignment => {
      const role = team.find((c) => c.id === assignment.collaborator_id)?.role || '';
      if (activeTab === 'Professores') return role === 'graduado' || role === 'estagiario';
      if (activeTab === 'Recepção') return role === 'recepcao';
      if (activeTab === 'Limpeza') return role === 'servicos_gerais' || role === 'limpeza';
      return true;
    });
  }, [result?.assignments, activeTab, team]);

  // Calendar logic
  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  const calendarDays = useMemo(() => {
    const groups: Record<string, ShiftAssignment[]> = {};
    daysOfWeek.forEach(d => groups[d] = []);

    filteredAssignments.forEach(assignment => {
      const matchedDay = daysOfWeek.find(d => assignment.date.startsWith(d));
      if (matchedDay) {
        groups[matchedDay].push(assignment);
      } else {
        // Fallback para nomes inesperados
        const firstWord = assignment.date.split(' ')[0];
        if (!groups[firstWord]) groups[firstWord] = [];
        groups[firstWord].push(assignment);
      }
    });

    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  }, [filteredAssignments]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 font-sans text-[#FFFFFF]">
      <div className="bg-[#141414] border border-[#232323] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-6xl w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] mb-6 sm:mb-8 text-center tracking-tight">
          Escala Certa<span className="text-[#FF4D1C]">.net</span>
        </h1>

        {/* Wizard Progress - Responsive Wrap */}
        <div className="flex flex-wrap justify-between sm:justify-center items-center mb-8 border-b border-[#232323] pb-6 gap-2 sm:gap-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors duration-300 ${step >= i ? 'bg-[#FF4D1C] text-[#FFFFFF] shadow-[0_0_10px_#FF6B3D]' : 'bg-[#0A0A0A] border border-[#232323] text-[#A1A1A1]'}`}>
                {i}
              </div>
              {i < 3 && <div className={`hidden sm:block w-12 md:w-24 h-1 mx-2 transition-colors duration-300 ${step > i ? 'bg-[#FF4D1C]' : 'bg-[#232323]'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF]">1. Equipe e Restrições</h2>
                <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Regra do Asterisco (*): Marque quem não pode no Sábado 1.</p>
              </div>
              <button onClick={addCollaborator} className="flex items-center gap-2 bg-[#FF4D1C] text-[#FFFFFF] px-4 py-2 rounded-lg hover:bg-[#FF6B3D] transition shadow-[0_0_10px_rgba(255,107,61,0.2)] w-full sm:w-auto justify-center">
                <Plus size={18} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {team.map((c) => (
                <div key={c.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 border border-[#232323] bg-[#0A0A0A] rounded-xl">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCollaborator(c.id, 'name', e.target.value)}
                    placeholder="Nome do Colaborador"
                    className="flex-1 p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none"
                  />
                  <select
                    value={c.role}
                    onChange={(e) => updateCollaborator(c.id, 'role', e.target.value)}
                    className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none"
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
                  <button onClick={() => removeCollaborator(c.id)} className="p-2.5 text-red-500 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 rounded-lg transition flex justify-center">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF]">2. Configuração de Horários</h2>
            <p className="text-sm sm:text-base text-[#A1A1A1]">Defina os inícios por dia. Os términos são somados por função (Ex: Graduado +6h).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shifts.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 p-4 border border-[#232323] bg-[#0A0A0A] rounded-xl">
                  <div className="font-bold text-[#FFFFFF] text-sm truncate">{s.name}</div>
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block truncate">Início</label>
                      <input
                        type="time"
                        value={s.start_time}
                        onChange={(e) => updateShift(s.id, 'start_time', e.target.value)}
                        className="p-2 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-[10px] sm:text-xs focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block truncate" title="Graduados">Grad.</label>
                      <input
                        type="number"
                        min="0"
                        value={s.required_graduados}
                        onChange={(e) => updateShift(s.id, 'required_graduados', parseInt(e.target.value) || 0)}
                        className="p-2 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-[10px] sm:text-xs focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block truncate" title="Estagiários">Estag.</label>
                      <input
                        type="number"
                        min="0"
                        value={s.required_estagiarios}
                        onChange={(e) => updateShift(s.id, 'required_estagiarios', parseInt(e.target.value) || 0)}
                        className="p-2 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-[10px] sm:text-xs focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block truncate" title="Recepção">Recep.</label>
                      <input
                        type="number"
                        min="0"
                        value={s.required_recepcao}
                        onChange={(e) => updateShift(s.id, 'required_recepcao', parseInt(e.target.value) || 0)}
                        className="p-2 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-[10px] sm:text-xs focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block truncate" title="Limpeza">Limp.</label>
                      <input
                        type="number"
                        min="0"
                        value={s.required_servicos_gerais}
                        onChange={(e) => updateShift(s.id, 'required_servicos_gerais', parseInt(e.target.value) || 0)}
                        className="p-2 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-[10px] sm:text-xs focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 - CALENDAR VIEW */}
        {step === 3 && result && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Calendar className="text-[#FF4D1C]" />
                  Calendário da Escala
                </h2>
                <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Visualização semanal agrupada por dias e cores.</p>
              </div>
              <button 
                onClick={restartProcess}
                className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#232323] hover:bg-[#232323] text-[#FFFFFF] rounded-lg transition-colors shadow-sm text-sm"
              >
                <Home size={16} /> Nova Escala
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-[#232323] pb-4">
              {['Professores', 'Recepção', 'Limpeza'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
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
            <div className="flex gap-4">
              <div className="p-4 rounded-xl border border-[#232323] bg-[#0A0A0A] flex-1">
                <p className="text-xs font-semibold text-[#A1A1A1] mb-3 uppercase tracking-wider">Plantões por Pessoa (Cores)</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.shift_counts).map(([id, count]) => {
                    const c = team.find(x => x.id === id);
                    const colorClass = teamColorMap.get(id) || 'bg-gray-500';
                    return c ? (
                      <span key={id} className="flex items-center gap-2 bg-[#141414] pr-3 py-1 rounded-full text-xs font-medium border border-[#232323] text-[#FFFFFF]">
                        <span className={`w-3 h-3 rounded-full ml-1 ${colorClass}`}></span>
                        {c.name}: <span className="text-[#FF4D1C] font-bold">{count}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Unfilled warnings */}
            {result.unfilled_shifts && result.unfilled_shifts.length > 0 && (
              <div className="p-4 bg-orange-950/30 border border-orange-900/50 text-orange-400 rounded-xl">
                <p className="font-bold flex items-center gap-2 mb-2 text-sm"><AlertCircle size={16} /> Atenção: Faltam colaboradores</p>
                <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1 text-orange-300/80">
                  {result.unfilled_shifts.map((u, idx) => (
                    <li key={idx}>
                      Faltam {u.missing} {u.role}(s) no dia/turno {shifts.find(s => s.id === u.shift_id)?.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Google Agenda Style Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {daysOfWeek.map(day => (
                <div key={day} className="flex flex-col bg-[#0A0A0A] rounded-xl border border-[#232323] overflow-hidden">
                  <div className="bg-[#141414] border-b border-[#232323] p-3 text-center">
                    <h3 className="font-bold text-[#FFFFFF] text-sm uppercase tracking-wider">{day}</h3>
                  </div>
                  <div className="p-2 space-y-2 flex-1 min-h-[120px]">
                    {calendarDays[day]?.length > 0 ? (
                      calendarDays[day].map((assignment, idx) => {
                        const collaborator = team.find(c => c.id === assignment.collaborator_id);
                        const colorClass = teamColorMap.get(assignment.collaborator_id) || 'bg-gray-500';
                        return (
                          <div 
                            key={`${assignment.shift_id}-${idx}`} 
                            className={`p-2.5 rounded-lg border-l-4 shadow-sm bg-[#141414] hover:bg-[#1A1A1A] transition-colors relative overflow-hidden`}
                            style={{ borderLeftColor: 'var(--tw-color)' }}
                          >
                            {/* Color Bar / Accent */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}></div>
                            <div className="pl-1">
                              <p className="text-[10px] font-bold text-[#A1A1A1] mb-0.5">{assignment.start_time} - {assignment.end_time}</p>
                              <p className="text-xs font-semibold text-[#FFFFFF] truncate" title={collaborator?.name || 'Vazio'}>
                                {collaborator?.name || 'Desconhecido'}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] text-[#A1A1A1]/40 uppercase tracking-widest">Sem Plantão</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredAssignments.length === 0 && (
              <div className="p-8 text-center text-[#A1A1A1] bg-[#0A0A0A] rounded-xl border border-[#232323]">
                Nenhum plantão foi alocado para este filtro. Verifique as configurações.
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-between border-t border-[#232323] pt-6 gap-4">
          {step > 1 && step < 3 && (
            <button 
              onClick={handleBack} 
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-[#A1A1A1] bg-[#0A0A0A] border border-[#232323] hover:bg-[#232323] transition-colors text-sm sm:text-base order-2 sm:order-1"
            >
              Voltar
            </button>
          )}
          {step === 1 && <div className="hidden sm:block"></div>}
          
          {step < 3 && (
            <button 
              onClick={handleNext} 
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-[#FFFFFF] transition-all text-sm sm:text-base order-1 sm:order-2 ${
                'bg-[#FF4D1C] hover:bg-[#FF6B3D] shadow-[0_0_15px_rgba(255,107,61,0.2)] hover:shadow-[0_0_20px_rgba(255,107,61,0.4)]'
              }`}
            >
              {step === 2 ? 'Gerar Calendário' : 'Avançar'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
