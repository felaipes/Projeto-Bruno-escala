"use client";
import { useState, useMemo } from "react";
import { AlertCircle, Home, Calendar, Users, Clock, CalendarDays } from 'lucide-react';

type Collaborator = {
  id: string;
  name: string;
  role: string;
  block_saturday_1: boolean;
  professor_mode?: string;
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

const PROFESSIONAL_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-violet-500'
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
  const [selectedDays, setSelectedDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);

  // Step 2 State
  const [team, setTeam] = useState<Collaborator[]>([]);

  // Step 3 State
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Result State
  const [result, setResult] = useState<ScheduleResult | null>(null);

  const teamColorMap = useMemo(() => {
    const map = new Map<string, string>();
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
              professor_mode: r.key === 'graduado' ? 'nenhum' : undefined
            });
         }
      }
    });
    setTeam(newTeam);
  };

  const generateShifts = () => {
    let newShifts: Shift[] = [];
    const turnos = [
       { suffix: '1', name: 'Turno 1', defaultTime: '05:00' },
       { suffix: '2', name: 'Turno 2', defaultTime: '11:00' },
       { suffix: '3', name: 'Turno 3', defaultTime: '17:00' },
    ];
    
    // Sort selected days by standard week order
    const sortedDays = [...selectedDays].sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
    
    sortedDays.forEach(day => {
       const isWeekend = day === 'Sábado' || day === 'Domingo';
       const weeks = isWeekend ? [1, 2, 3, 4] : [1];
       
       weeks.forEach(week => {
           const dayPrefix = isWeekend ? `${day} (Semana ${week})` : day;
           const dayIdPrefix = isWeekend ? `${day}-Semana${week}` : day;
           
           turnos.forEach(t => {
              const shiftId = `${dayIdPrefix}-${t.suffix}`;
              const existing = shifts.find(s => s.id === shiftId);
              newShifts.push({
                 id: shiftId,
                 name: `${dayPrefix} - ${t.name}`,
                 start_time: existing ? existing.start_time : t.defaultTime,
                 required_graduados: roleCounts.graduado,
                 required_estagiarios: roleCounts.estagiario,
                 required_recepcao: roleCounts.recepcao,
                 required_servicos_gerais: roleCounts.servicos_gerais
              });
           });
       });
    });
    setShifts(newShifts);
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
      // Validate names
      const emptyNames = team.some(c => c.name.trim() === '');
      if (emptyNames) {
        setError("Por favor, preencha o nome de todos os colaboradores.");
        return;
      }
      setError(null);
      generateShifts();
      setStep(3);
    } else if (step === 3) {
      // Generate Schedule
      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://projeto-bruno-escala.onrender.com';
        const response = await fetch(`${API_URL}/api/schedule/type-1`, {
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
  
  const calendarDays = useMemo(() => {
    const groups: Record<string, ShiftAssignment[]> = {};
    const dayGroups = [...daysOfWeek];
    
    // Expand weekends in calendar columns
    if (selectedDays.includes('Sábado')) {
        dayGroups.push('Sábado (Semana 1)', 'Sábado (Semana 2)', 'Sábado (Semana 3)', 'Sábado (Semana 4)');
    }
    if (selectedDays.includes('Domingo')) {
        dayGroups.push('Domingo (Semana 1)', 'Domingo (Semana 2)', 'Domingo (Semana 3)', 'Domingo (Semana 4)');
    }
    
    dayGroups.forEach(d => groups[d] = []);

    filteredAssignments.forEach(assignment => {
      const dateKey = assignment.date.split(' - ')[0]; // Gets e.g. "Sábado (Semana 1)" or "Segunda"
      if (groups[dateKey]) {
        groups[dateKey].push(assignment);
      } else {
        const firstWord = dateKey.split(' ')[0];
        if (!groups[firstWord]) groups[firstWord] = [];
        groups[firstWord].push(assignment);
      }
    });

    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  }, [filteredAssignments, selectedDays]);

  const renderTeamInputs = (roleKey: string, roleName: string) => {
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
              
              {roleKey === 'graduado' && (
                <div className="flex bg-[#141414] rounded-lg border border-[#232323] overflow-hidden shrink-0">
                  <button
                    onClick={() => updateCollaborator(c.id, 'professor_mode', 'nenhum')}
                    className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-colors ${c.professor_mode === 'nenhum' || !c.professor_mode ? 'bg-[#232323] text-[#FFFFFF]' : 'text-[#A1A1A1] hover:bg-[#232323]'}`}
                  >
                    Qualquer
                  </button>
                  <button
                    onClick={() => updateCollaborator(c.id, 'professor_mode', 'abre')}
                    className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-colors ${c.professor_mode === 'abre' ? 'bg-[#FF4D1C] text-[#FFFFFF]' : 'text-[#A1A1A1] hover:bg-[#232323]'}`}
                  >
                    Abre (Cedo)
                  </button>
                  <button
                    onClick={() => updateCollaborator(c.id, 'professor_mode', 'fecha')}
                    className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-colors ${c.professor_mode === 'fecha' ? 'bg-[#FF4D1C] text-[#FFFFFF]' : 'text-[#A1A1A1] hover:bg-[#232323]'}`}
                  >
                    Fecha (Tarde)
                  </button>
                </div>
              )}
              
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
                Dias da Semana
              </h2>
              <p className="text-sm text-[#A1A1A1] mb-4">Selecione os dias de expediente. Sábados e Domingos geram 4 finais de semana para rodízio automático.</p>
              
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
              <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Marque quais professores abrem (primeiro turno) e fecham (último turno).</p>
            </div>

            <div className="bg-[#141414] rounded-xl">
              {renderTeamInputs('graduado', 'Professores Graduados')}
              {renderTeamInputs('estagiario', 'Professores Estagiários')}
              {renderTeamInputs('recepcao', 'Recepção')}
              {renderTeamInputs('servicos_gerais', 'Limpeza / Serviços Gerais')}
            </div>
          </div>
        )}

        {/* Step 3: Turnos */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] flex items-center gap-2">
                <Clock className="text-[#FF4D1C]" />
                3. Configuração de Turnos
              </h2>
              <p className="text-sm sm:text-base text-[#A1A1A1] mt-1">Defina o início de cada turno. Finais de semana foram multiplicados por 4 semanas para o rodízio.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shifts.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 p-4 border border-[#232323] bg-[#0A0A0A] rounded-xl">
                  <div className="font-bold text-[#FFFFFF] text-sm truncate" title={s.name}>{s.name}</div>
                  <div>
                    <label className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider mb-1 block">Início do Turno</label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateShift(s.id, 'start_time', e.target.value)}
                      className="p-2.5 bg-[#141414] border border-[#232323] rounded-lg text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#FF6B3D] outline-none w-full font-mono"
                    />
                  </div>
                  
                  {/* Opção avançada */}
                  <details className="mt-2 text-xs">
                    <summary className="text-[#A1A1A1] cursor-pointer hover:text-[#FFFFFF] select-none">Ajustar Quantidades deste Turno</summary>
                    <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-[#141414] rounded-lg border border-[#232323]">
                      <div>
                        <label className="text-[10px] text-[#A1A1A1] uppercase">Grad.</label>
                        <input type="number" min="0" value={s.required_graduados} onChange={(e) => updateShift(s.id, 'required_graduados', parseInt(e.target.value) || 0)} className="w-full bg-[#0A0A0A] border border-[#232323] rounded p-1 text-[#FFFFFF]"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A1A1A1] uppercase">Estag.</label>
                        <input type="number" min="0" value={s.required_estagiarios} onChange={(e) => updateShift(s.id, 'required_estagiarios', parseInt(e.target.value) || 0)} className="w-full bg-[#0A0A0A] border border-[#232323] rounded p-1 text-[#FFFFFF]"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A1A1A1] uppercase">Recep.</label>
                        <input type="number" min="0" value={s.required_recepcao} onChange={(e) => updateShift(s.id, 'required_recepcao', parseInt(e.target.value) || 0)} className="w-full bg-[#0A0A0A] border border-[#232323] rounded p-1 text-[#FFFFFF]"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A1A1A1] uppercase">Limp.</label>
                        <input type="number" min="0" value={s.required_servicos_gerais} onChange={(e) => updateShift(s.id, 'required_servicos_gerais', parseInt(e.target.value) || 0)} className="w-full bg-[#0A0A0A] border border-[#232323] rounded p-1 text-[#FFFFFF]"/>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
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
            <div className="flex overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-3 min-w-max">
                {Object.keys(calendarDays).filter(day => calendarDays[day]?.length > 0 || !day.includes('Semana')).map(day => (
                  <div key={day} className="flex flex-col bg-[#0A0A0A] rounded-xl border border-[#232323] overflow-hidden w-40 shrink-0">
                    <div className="bg-[#141414] border-b border-[#232323] p-3 text-center">
                      <h3 className="font-bold text-[#FFFFFF] text-xs uppercase tracking-wider truncate" title={day}>{day}</h3>
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
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`}></div>
                              <div className="pl-1">
                                <p className="text-[10px] font-bold text-[#A1A1A1] mb-0.5">{assignment.start_time.substring(0,5)} - {assignment.end_time.substring(0,5)}</p>
                                <p className="text-xs font-semibold text-[#FFFFFF] truncate" title={collaborator?.name || 'Vazio'}>
                                  {collaborator?.name || 'Desconhecido'}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-[10px] text-[#A1A1A1]/40 uppercase tracking-widest text-center mt-4">Sem Plantão</p>
                        </div>
                      )}
                    </div>
                  </div>
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
