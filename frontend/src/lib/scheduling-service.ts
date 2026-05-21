// ── Types ────────────────────────────────────────────────────────────────────

export interface CollaboratorInput {
  id: string;
  name: string;
  role: string;
  block_saturday_1: boolean;
}

export interface ShiftInput {
  id: string;
  name: string;
  start_time: string;
  required_graduados: number;
  required_estagiarios: number;
  required_recepcao: number;
  required_servicos_gerais: number;
}

export interface ScheduleRequest {
  collaborators: CollaboratorInput[];
  shifts: ShiftInput[];
  month?: number | null;
  year?: number | null;
}

export interface ShiftAssignment {
  id?: string;
  shift_id: string;
  shift_name: string;
  collaborator_id: string;
  collaborator_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface UnfilledShift {
  shift_id: string;
  shift_name: string;
  date: string;
  role: string;
  missing: number;
}

export interface ScheduleResult {
  assignments: ShiftAssignment[];
  unfilled_shifts: UnfilledShift[];
  shift_counts: Record<string, number>;
  month?: number | null;
  year?: number | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_MAP: Record<string, number> = {
  segunda: 0,
  terça: 1,
  terca: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sábado: 5,
  sabado: 5,
  domingo: 6,
};

const DURATIONS: Record<string, number> = {
  graduado: 6,
  estagiario: 5,
  recepcao: 6,
  servicos_gerais: 6,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = (h + hours) * 60 + m;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function detectWeekday(shiftName: string): number | null {
  const lower = shiftName.toLowerCase();
  for (const [key, wd] of Object.entries(WEEKDAY_MAP)) {
    if (lower.includes(key)) return wd;
  }
  return null;
}

function datesForWeekday(weekday: number, month: number, year: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getDay() === ((weekday + 1) % 7)) {
      // JS: Sun=0, Mon=1 … Sat=6  |  Python: Mon=0 … Sun=6
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dates.push(iso);
    }
  }
  return dates;
}

// ── Service ──────────────────────────────────────────────────────────────────

export function generateSchedule(request: ScheduleRequest): ScheduleResult {
  const collaborators = request.collaborators.map((c) => ({ ...c }));
  const shifts = request.shifts.map((s) => ({ ...s }));
  const month = request.month ?? null;
  const year = request.year ?? null;

  // Validate asterisk rule
  for (const role of ["graduado", "estagiario", "recepcao"]) {
    const group = collaborators.filter((c) => c.role === role);
    const blocked = group.filter((c) => c.block_saturday_1);
    if (blocked.length > 2) {
      throw new Error(`Máximo de 2 ${role}s bloqueados no Sábado 1.`);
    }
    if (group.length > 0 && blocked.length === group.length) {
      throw new Error(`100% dos ${role}s estão bloqueados para o Sábado 1.`);
    }
  }

  const useRealDates = month !== null && year !== null;
  const assignments: ShiftAssignment[] = [];
  const unfilled: UnfilledShift[] = [];
  const shiftCounts: Record<string, number> = {};
  const booked: Record<string, Set<string>> = {};

  for (const c of collaborators) {
    shiftCounts[c.id] = 0;
    booked[c.id] = new Set();
  }

  const roleGroups: Record<string, CollaboratorInput[]> = {
    graduado: collaborators.filter((c) => c.role === "graduado"),
    estagiario: collaborators.filter((c) => c.role === "estagiario"),
    recepcao: collaborators.filter((c) => c.role === "recepcao"),
    servicos_gerais: collaborators.filter((c) => c.role === "servicos_gerais"),
  };

  for (const shift of shifts) {
    const isSaturday1 =
      shift.name.toLowerCase().includes("sábado") &&
      shift.name.toLowerCase().includes("turno 1");

    let dates: (string | null)[];
    if (useRealDates) {
      const weekday = detectWeekday(shift.name);
      dates =
        weekday !== null
          ? datesForWeekday(weekday, month!, year!)
          : [null];
    } else {
      dates = [null];
    }

    const requiredMap: Record<string, number> = {
      graduado: shift.required_graduados,
      estagiario: shift.required_estagiarios,
      recepcao: shift.required_recepcao,
      servicos_gerais: shift.required_servicos_gerais,
    };

    for (const currentDate of dates) {
      const dateLabel = currentDate ?? shift.name;

      for (const [role, requiredCount] of Object.entries(requiredMap)) {
        if (requiredCount === 0) continue;

        const candidates = (roleGroups[role] || [])
          .filter(
            (c) =>
              !(isSaturday1 && c.block_saturday_1) &&
              !booked[c.id].has(`${dateLabel}|${shift.start_time}`)
          )
          .sort((a, b) => shiftCounts[a.id] - shiftCounts[b.id]);

        let assigned = 0;
        for (const c of candidates) {
          if (assigned >= requiredCount) break;
          const endTime = addHours(shift.start_time, DURATIONS[role] ?? 6);
          assignments.push({
            shift_id: shift.id,
            shift_name: shift.name,
            collaborator_id: c.id,
            collaborator_name: c.name,
            date: dateLabel,
            start_time: shift.start_time,
            end_time: endTime,
          });
          booked[c.id].add(`${dateLabel}|${shift.start_time}`);
          shiftCounts[c.id] += 1;
          assigned += 1;
        }

        if (assigned < requiredCount) {
          unfilled.push({
            shift_id: shift.id,
            shift_name: shift.name,
            date: dateLabel,
            role,
            missing: requiredCount - assigned,
          });
        }
      }
    }
  }

  return {
    assignments,
    unfilled_shifts: unfilled,
    shift_counts: shiftCounts,
    month,
    year,
  };
}
