export type ShiftTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  weekday: number; // 0=Sun … 6=Sat
};

// weekday → shift templates for that day
export const SHIFT_TEMPLATES: Record<number, ShiftTemplate[]> = {
  0: [{ id: "dom-1", name: "Domingo", start_time: "08:00", end_time: "14:00", weekday: 0 }],
  1: [
    { id: "seg-1", name: "Segunda (Turno 1)", start_time: "05:00", end_time: "11:00", weekday: 1 },
    { id: "seg-2", name: "Segunda (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 1 },
    { id: "seg-3", name: "Segunda (Turno 3)", start_time: "17:00", end_time: "23:00", weekday: 1 },
  ],
  2: [
    { id: "ter-1", name: "Terça (Turno 1)", start_time: "05:00", end_time: "11:00", weekday: 2 },
    { id: "ter-2", name: "Terça (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 2 },
    { id: "ter-3", name: "Terça (Turno 3)", start_time: "17:00", end_time: "23:00", weekday: 2 },
  ],
  3: [
    { id: "qua-1", name: "Quarta (Turno 1)", start_time: "05:00", end_time: "11:00", weekday: 3 },
    { id: "qua-2", name: "Quarta (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 3 },
    { id: "qua-3", name: "Quarta (Turno 3)", start_time: "17:00", end_time: "23:00", weekday: 3 },
  ],
  4: [
    { id: "qui-1", name: "Quinta (Turno 1)", start_time: "05:00", end_time: "11:00", weekday: 4 },
    { id: "qui-2", name: "Quinta (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 4 },
    { id: "qui-3", name: "Quinta (Turno 3)", start_time: "17:00", end_time: "23:00", weekday: 4 },
  ],
  5: [
    { id: "sex-1", name: "Sexta (Turno 1)", start_time: "05:00", end_time: "11:00", weekday: 5 },
    { id: "sex-2", name: "Sexta (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 5 },
    { id: "sex-3", name: "Sexta (Turno 3)", start_time: "17:00", end_time: "23:00", weekday: 5 },
  ],
  6: [
    { id: "sab-1", name: "Sábado (Turno 1)", start_time: "08:00", end_time: "14:00", weekday: 6 },
    { id: "sab-2", name: "Sábado (Turno 2)", start_time: "11:00", end_time: "17:00", weekday: 6 },
  ],
};

export function getTemplatesForDate(dateStr: string): ShiftTemplate[] {
  const wd = new Date(dateStr + "T12:00:00").getDay();
  return SHIFT_TEMPLATES[wd] ?? [];
}

export const ROLE_LABEL: Record<string, string> = {
  graduado: "Graduado",
  estagiario: "Estagiário",
  recepcao: "Recepção",
  servicos_gerais: "Serv. Gerais",
};

export const ROLE_COLOR: Record<string, string> = {
  graduado:       "bg-blue-950/50 text-blue-300 border border-blue-900/30",
  estagiario:     "bg-purple-950/50 text-purple-300 border border-purple-900/30",
  recepcao:       "bg-green-950/50 text-green-300 border border-green-900/30",
  servicos_gerais:"bg-yellow-950/50 text-yellow-300 border border-yellow-900/30",
};

export const ROLE_DOT: Record<string, string> = {
  graduado: "bg-blue-500",
  estagiario: "bg-purple-500",
  recepcao: "bg-green-500",
  servicos_gerais: "bg-yellow-500",
};

export const ROLE_CHIP: Record<string, string> = {
  graduado: "bg-blue-950/60 text-blue-300",
  estagiario: "bg-purple-950/60 text-purple-300",
  recepcao: "bg-green-950/60 text-green-300",
  servicos_gerais: "bg-yellow-950/60 text-yellow-300",
};
