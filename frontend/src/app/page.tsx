"use client";
import { useState, useMemo } from "react";
import { AlertCircle, Home, Calendar, Users, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

type Collaborator = {
  id: string;
  name: string;
  role: string;
  block_saturday_1: boolean;
  start_time: string;
  end_time: string;
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

const PROFESSIONAL_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-500' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', dot: 'bg-pink-500' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400', dot: 'bg-teal-500' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  { bg: 'bg-lime-500/20', border: 'border-lime-500/50', text: 'text-lime-400', dot: 'bg-lime-500' },
  { bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', text: 'text-fuchsia-400', dot: 'bg-fuchsia-500' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400', dot: 'bg-violet-500' }
];

const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Professores');

  // Step 1 State
  const [roleCounts, setRoleCounts] = useState({
    graduado: 2,
    estagiario: 1,
    recepcao: 1,
    servicos_gerais: 1
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']);

  // Step 2 & 3 State
  const [team, setTeam] = useState<Collaborator[]>([]);

  // Result State
  const [result, setResult] = useState<ScheduleResult | null>(null);

  const teamColorMap = useMemo(() => {
    const map = new Map<string, typeof PROFESSIONAL_COLORS[0]>();
    team.forEach((member, index) => {
      map.set(member.id, PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length]);
    });
    return map;
  }, [team]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const updateRoleCount = (role: keyof typeof roleCounts, value: number) => {
    setRoleCounts(prev => ({ ...prev, [role]: Math.max(0, Math.min(20, value)) }));
  };

  const generateTeam = () => {
    let newTeam: Collaborator[] = [];
    const roles = [
      { key: 'graduado', label: 'Graduado' },
      { key: 'estagiario', label: 'Estagiário' },
      { key: 'recepcao', label: 'Recepção' },
      { key: 'servicos_gerais', label: 'Serviços Gerais' }
    ];
    
    roles.forEach(r => {
      const existingOfRole = team.filter(c => c.role === r.key);
      const count = roleCounts[r.key as keyof typeof roleCounts];
      for(let i=0; i < count; i++) {
         if (i < existingOfRole.length) {
            newTeam.push(existingOfRole[i]);
         } else {
            newTeam.push({
              id: `${r.key}-${Date.now()}-${i}`,
              name: '',
              role: r.key,
              block_saturday_1: false,
              start_time: '08:00',
              end_time: r.key === 'estagiario' ? '13:00' : '14:00'
            });
         }
      }
    });
    setTeam(newTeam);
  };

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const calculateDuration = (start: string, end: string) => {
    const startMins = parseTimeToMinutes(start);
    const endMins = parseTimeToMinutes(end);
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60; // cruza a meia noite
    
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { h, m, totalMins: diff };
  };

  const isValidDuration = (c: Collaborator) => {
    const { totalMins } = calculateDuration(c.start_time, c.end_time);
    if (c.role === 'estagiario' && totalMins > 5 * 60) return false;
    if (c.role !== 'estagiario' && totalMins > 6 * 60) return false;
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (selectedDays.length === 0) {
        setError("Selecione pelo menos um dia da semana.");
        return;
      }
      setError(null);
      generateTeam();
      setStep(2);
    } else if (step === 2) {
      const emptyNames = team.some(c => c.name.trim() === '');
      if (emptyNames) {
        setError("Por favor, preencha o nome de todos os colaboradores.");
        return;
      }
      setError(null);
      setStep(3);
    } else if (step === 3) {
      // Validate duracoes
      const invalidMembers = team.filter(c => !isValidDuration(c));
      if (invalidMembers.length > 0) {
        setError("Existem colaboradores excedendo o limite da carga horária permitida (Graduados: 6h, Estagiários: 5h). Corrija os campos em vermelho.");
        return;
      }

      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://projeto-bruno-escala.onrender.com';
        const response = await fetch(`${API_URL}/api/schedule/type-1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaborators: team, selected_days: selectedDays }),
        });

        if (!response.ok) {
          const errData = await response.json();
          let errorMsg = 'Erro ao gerar escala.';
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errorMsg = errData.detail;
            } else if (Array.isArray(errData.detail)) {
              errorMsg = errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
            } else {
              errorMsg = JSON.stringify(errData.detail);
            }
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        setResult(data);
        setStep(4);
      } catch (err: any) {
        setError(err.message);
      }
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

  const updateCollaborator = (id: string, field: keyof Collaborator, value: any) => {
    setTeam(team.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
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
  
  const calendarGrid = useMemo(() => {
    const weeks = [0, 1, 2, 3]; // 4 Semanas (índices)
    const grid: Record<string, ShiftAssignment[]>[] = [];
    
    weeks.forEach(() => {
       const weekRow: Record<string, ShiftAssignment[]> = {};
       daysOfWeek.forEach(day => {
          weekRow[day] = [];
       });
       grid.push(weekRow);
    });

    filteredAssignments.forEach(assignment => {
       const isWeekend = assignment.date.includes('Semana');
       
       if (isWeekend) {
          const match = assignment.date.match(/Semana (\d)/);
          const weekIdx = match ? parseInt(match[1]) - 1 : 0;
          const baseDay = assignment.date.split(' ')[0]; // Sábado ou Domingo
          
          if (grid[weekIdx] && grid[weekIdx][baseDay]) {
             grid[weekIdx][baseDay].push(assignment);
          }
       } else {
          // Dia Útil (Segunda a Sexta): Clonar para todas as 4 semanas visualmente
          const baseDay = assignment.date;
          if (daysOfWeek.includes(baseDay)) {
             weeks.forEach((weekIdx) => {
                grid[weekIdx][baseDay].push(assignment);
             });
          }
       }
    });

    grid.forEach(weekRow => {
       Object.values(weekRow).forEach(cell => {
          cell.sort((a, b) => a.start_time.localeCompare(b.start_time));
       });
    });

    return grid;
  }, [filteredAssignments]);

  const renderNamesInput = (roleKey: string, roleName: string) => {
    const members = team.filter(c => c.role === roleKey);
    if (members.length === 0) return null;
    
    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-lg font-bold text-[#FF4D1C] mb-3 border-b border-[#232323] pb-2">{roleName} ({members.length})</h3>
        <div className="space-y-3">
          {members.map((c, index) => (
            <div key={c.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 border border-[#232323] bg-[#0A0A0A] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#232323] flex items-center justify-center font-bold text-xs text-[#A1A1A1] shrink-0">
                {index + 1}
              </div>
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCollaborator(c.id, 'name', e.target.value)}
                placeholder={`Nome do ${roleName}`}
                className="flex-1 p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none"
              />
              
              <label className="flex items-center gap-2 cursor-pointer bg-[#141414] px-3 py-2.5 border border-[#232323] rounded-lg shrink-0">
                <input
                  type="checkbox"
                  checked={c.block_saturday_1}
                  onChange={(e) => updateCollaborator(c.id, 'block_saturday_1', e.target.checked)}
                  className="w-4 h-4 text-[#FF4D1C] rounded border-[#232323] bg-[#0A0A0A] focus:ring-[#FF6B3D] focus:ring-offset-[#141414]"
                />
                <span className="text-xs font-medium text-[#A1A1A1]">Bloquear Sáb 1 (*)</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'graduado': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Graduado (Max 6h)</span>;
      case 'estagiario': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Estagiário (Max 5h)</span>;
      case 'recepcao': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Recepção (Max 6h)</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Limpeza (Max 6h)</span>;
    }
  };

  const renderTimesTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232323]">
              <th className="p-3 text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Colaborador</th>
              <th className="p-3 text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Entrada</th>
              <th className="p-3 text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Saída</th>
              <th className="p-3 text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">Total de Horas</th>
            </tr>
          </thead>
          <tbody>
            {team.map(c => {
              const { h, m } = calculateDuration(c.start_time, c.end_time);
              const valid = isValidDuration(c);
              
              return (
                <tr key={c.id} className="border-b border-[#232323] hover:bg-[#141414]/50 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#FFFFFF]">{c.name || 'Sem nome'}</span>
                      {getRoleBadge(c.role)}
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      value={c.start_time}
                      onChange={(e) => updateCollaborator(c.id, 'start_time', e.target.value)}
                      className="p-2 bg-[#0A0A0A] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      value={c.end_time}
                      onChange={(e) => updateCollaborator(c.id, 'end_time', e.target.value)}
                      className="p-2 bg-[#0A0A0A] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm ${valid ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      {valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {h}h {m > 0 ? `${m}m` : ''}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 font-sans text-[#FFFFFF]">
      <div className="bg-[#141414] border border-[#232323] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-[1400px] w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] mb-6 sm:mb-8 text-center tracking-tight">
          Escala Certa<span className="text-[#FF4D1C]">.net</span>
        </h1>

        {/* Wizard Progress */}
        <div className="flex flex-wrap justify-between sm:justify-center items-center mb-8 border-b border-[#232323] pb-6 gap-2 sm:gap-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors duration-300 ${step >= i ? 'bg-[#FF4D1C] text-[#FFFFFF] shadow-[0_0_10px_#FF6B3D]' : 'bg-[#0A0A0A] border border-[#232323] text-[#A1A1A1]'}`}>
                {i}
              </div>
              {i < 4 && <div className={`hidden sm:block w-8 md:w-16 h-1 mx-2 transition-colors duration-300 ${step > i ? 'bg-[#FF4D1C]' : 'bg-[#232323]'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Step 1: Configuração Quantitativa e Dias */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2 mb-2">
                <Users className="text-[#FF4D1C]" />
                1. Quantidade de Colaboradores
              </h2>
              <p className="text-sm text-[#A1A1A1]">Quantas pessoas de cada função farão parte desta escala?</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'graduado', label: 'Graduados' },
                { key: 'estagiario', label: 'Estagiários' },
                { key: 'recepcao', label: 'Recepção' },
                { key: 'servicos_gerais', label: 'Limpeza' }
              ].map(role => (
                <div key={role.key} className="bg-[#0A0A0A] border border-[#232323] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-semibold text-[#A1A1A1] mb-3 uppercase tracking-wider">{role.label}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateRoleCount(role.key as keyof typeof roleCounts, roleCounts[role.key as keyof typeof roleCounts] - 1)}
                      className="w-8 h-8 rounded-lg bg-[#141414] border border-[#232323] text-[#FFFFFF] hover:bg-[#232323] hover:text-[#FF4D1C] font-bold flex items-center justify-center"
                    >-</button>
                    <span className="text-2xl font-bold w-6">{roleCounts[role.key as keyof typeof roleCounts]}</span>
                    <button 
                      onClick={() => updateRoleCount(role.key as keyof typeof roleCounts, roleCounts[role.key as keyof typeof roleCounts] + 1)}
                      className="w-8 h-8 rounded-lg bg-[#141414] border border-[#232323] text-[#FFFFFF] hover:bg-[#232323] hover:text-[#FF4D1C] font-bold flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#232323]">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2 mb-2">
                <CalendarDays className="text-[#FF4D1C]" />
                Dias de Funcionamento
              </h2>
              <p className="text-sm text-[#A1A1A1] mb-4">A escala será desenhada para preencher os dias úteis selecionados. Finais de semana gerarão rodízio automático.</p>
              
              <div className="flex flex-wrap gap-3">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                      selectedDays.includes(day)
                        ? 'bg-[#FF4D1C] text-[#FFFFFF] border-[#FF4D1C] shadow-[0_0_10px_rgba(255,107,61,0.2)]'
                        : 'bg-[#0A0A0A] text-[#A1A1A1] border-[#232323] hover:border-[#FF4D1C]/50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Identificação dos Colaboradores */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF]">2. Identificação da Equipe</h2>
              <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Digite o nome dos colaboradores que farão parte da grade.</p>
            </div>

            <div className="bg-[#141414] rounded-xl">
              {renderNamesInput('graduado', 'Professores Graduados')}
              {renderNamesInput('estagiario', 'Professores Estagiários')}
              {renderNamesInput('recepcao', 'Recepção')}
              {renderNamesInput('servicos_gerais', 'Limpeza / Serviços Gerais')}
            </div>
          </div>
        )}

        {/* Step 3: Turnos Individuais */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2">
                <Clock className="text-[#FF4D1C]" />
                3. Carga Horária e Horários (Novo)
              </h2>
              <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Defina a Entrada e Saída individualmente. O cálculo de horas é em tempo real.</p>
            </div>
            
            <div className="bg-[#0A0A0A] border border-[#232323] rounded-xl p-2 sm:p-4">
               {renderTimesTable()}
            </div>
          </div>
        )}

        {/* Step 4 - CALENDAR VIEW */}
        {step === 4 && result && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Calendar className="text-[#FF4D1C]" />
                  Calendário Mensal da Escala
                </h2>
                <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Visualização em grade (Google Agenda) com rodízio inteligente.</p>
              </div>
              <button 
                onClick={restartProcess}
                className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#232323] hover:bg-[#232323] text-[#FFFFFF] rounded-lg transition-colors shadow-sm text-sm shrink-0"
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
                    const color = teamColorMap.get(id) || PROFESSIONAL_COLORS[0];
                    return c ? (
                      <span key={id} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${color.bg} ${color.border} ${color.text}`}>
                        <span className={`w-3 h-3 rounded-full ml-1 ${color.dot}`}></span>
                        {c.name}: <span>{count}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Google Agenda Style Grid */}
            <div className="overflow-x-auto rounded-xl border border-[#232323] bg-[#232323] shadow-lg">
              <div className="min-w-[800px] grid grid-cols-7 gap-px bg-[#232323]">
                {/* Headers */}
                {daysOfWeek.map(day => (
                  <div key={day} className="bg-[#141414] p-3 text-center">
                    <h3 className="font-bold text-[#FFFFFF] text-xs uppercase tracking-wider truncate">{day}</h3>
                  </div>
                ))}
                
                {/* Cells */}
                {calendarGrid.map((week, wIdx) => (
                  daysOfWeek.map(day => {
                    const assignments = week[day];
                    const isActive = selectedDays.includes(day);
                    
                    return (
                      <div key={`${wIdx}-${day}`} className={`min-h-[140px] p-2 flex flex-col transition-colors ${isActive ? 'bg-[#0A0A0A] hover:bg-[#0A0A0A]/80' : 'bg-[#141414]/50 opacity-50'}`}>
                        <div className="text-right mb-1">
                           <span className="text-[10px] font-bold text-[#A1A1A1]/40 uppercase tracking-widest bg-[#141414] px-1.5 py-0.5 rounded">Semana {wIdx + 1}</span>
                        </div>
                        <div className="space-y-1.5 flex-1">
                          {assignments.length > 0 ? (
                            assignments.map((assignment, aIdx) => {
                              const collaborator = team.find(c => c.id === assignment.collaborator_id);
                              const color = teamColorMap.get(assignment.collaborator_id) || PROFESSIONAL_COLORS[0];
                              return (
                                <div 
                                  key={`${assignment.shift_id}-${aIdx}`} 
                                  className={`px-2 py-1.5 rounded flex flex-col gap-0.5 border-l-[3px] shadow-sm transition-all hover:brightness-110 ${color.bg} ${color.border}`}
                                >
                                  <span className={`font-bold text-xs truncate leading-none ${color.text}`} title={collaborator?.name}>{collaborator?.name || 'Vazio'}</span>
                                  <span className={`text-[10px] font-mono leading-none ${color.text} opacity-80`}>{assignment.start_time.substring(0,5)} - {assignment.end_time.substring(0,5)}</span>
                                </div>
                              )
                            })
                          ) : (
                            <div className="h-full min-h-[40px] flex items-center justify-center">
                               {isActive && <span className="text-[10px] text-[#232323] italic">Livre</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ))}
              </div>
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
          {step > 1 && step < 4 && (
            <button 
              onClick={handleBack} 
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-[#A1A1A1] bg-[#0A0A0A] border border-[#232323] hover:bg-[#232323] transition-colors text-sm sm:text-base order-2 sm:order-1"
            >
              Voltar
            </button>
          )}
          {step === 1 && <div className="hidden sm:block"></div>}
          
          {step < 4 && (
            <button 
              onClick={handleNext} 
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-[#FFFFFF] transition-all text-sm sm:text-base order-1 sm:order-2 ${
                'bg-[#FF4D1C] hover:bg-[#FF6B3D] shadow-[0_0_15px_rgba(255,107,61,0.2)] hover:shadow-[0_0_20px_rgba(255,107,61,0.4)]'
              }`}
            >
              {step === 3 ? 'Gerar Calendário' : 'Avançar'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
