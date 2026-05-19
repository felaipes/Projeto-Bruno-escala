const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erro desconhecido");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  block_saturday_1: boolean;
  created_at: string;
};

export type Shift = {
  id: string;
  name: string;
  start_time: string;
  required_graduados: number;
  required_estagiarios: number;
  required_recepcao: number;
  required_servicos_gerais: number;
  created_at: string;
};

export type ShiftAssignment = {
  id: string;
  shift_id: string;
  shift_name: string;
  collaborator_id: string;
  collaborator_name: string;
  date: string;
  start_time: string;
  end_time: string;
};

export type ScheduleResult = {
  assignments: ShiftAssignment[];
  unfilled_shifts: { shift_id: string; shift_name: string; date: string; role: string; missing: number }[];
  shift_counts: Record<string, number>;
  month: number | null;
  year: number | null;
};

export type ScheduleRequest = {
  collaborators: Omit<Collaborator, "created_at">[];
  shifts: { id?: string; name: string; start_time: string; required_graduados: number; required_estagiarios: number; required_recepcao: number; required_servicos_gerais: number }[];
  month?: number;
  year?: number;
};

export type SaveScheduleResponse = { id: string; access_token: string };

export type ScheduleListItem = {
  id: string;
  month: number;
  year: number;
  access_token: string;
  created_at: string;
  assignments_count: number;
};

export type FullScheduleResponse = {
  id: string;
  month: number;
  year: number;
  access_token: string;
  assignments: ShiftAssignment[];
};

export type PublicScheduleResponse = {
  id: string;
  month: number;
  year: number;
  assignments: ShiftAssignment[];
};

export type AssignmentCreate = {
  collaborator_id: string;
  collaborator_name: string;
  shift_id: string;
  shift_name: string;
  date: string;
  start_time: string;
  end_time: string;
};

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
  collaborators: {
    list: () => request<Collaborator[]>("/api/collaborators/"),
    create: (data: Omit<Collaborator, "id" | "created_at">) =>
      request<Collaborator>("/api/collaborators/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Omit<Collaborator, "id" | "created_at">) =>
      request<Collaborator>(`/api/collaborators/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/api/collaborators/${id}`, { method: "DELETE" }),
  },

  shifts: {
    list: () => request<Shift[]>("/api/shifts/"),
    create: (data: Omit<Shift, "id" | "created_at">) =>
      request<Shift>("/api/shifts/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Omit<Shift, "id" | "created_at">) =>
      request<Shift>(`/api/shifts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/api/shifts/${id}`, { method: "DELETE" }),
  },

  schedules: {
    list: () => request<ScheduleListItem[]>("/api/schedules/"),
    getById: (id: string) => request<FullScheduleResponse>(`/api/schedules/${id}`),
    generate: (data: ScheduleRequest) =>
      request<ScheduleResult>("/api/schedules/generate", { method: "POST", body: JSON.stringify(data) }),
    save: (data: ScheduleRequest) =>
      request<SaveScheduleResponse>("/api/schedules/save", { method: "POST", body: JSON.stringify(data) }),
    createManual: (month: number, year: number) =>
      request<SaveScheduleResponse>("/api/schedules/manual", { method: "POST", body: JSON.stringify({ month, year }) }),
    getPublic: (token: string) =>
      request<PublicScheduleResponse>(`/api/schedules/public/${token}`),
    addAssignment: (scheduleId: string, data: AssignmentCreate) =>
      request<ShiftAssignment>(`/api/schedules/${scheduleId}/assignments`, { method: "POST", body: JSON.stringify(data) }),
    removeAssignment: (scheduleId: string, assignmentId: string) =>
      request<void>(`/api/schedules/${scheduleId}/assignments/${assignmentId}`, { method: "DELETE" }),
  },

  seed: () => request<{ message: string; collaborators: number; assignments: number; schedule_id: string }>("/api/seed", { method: "POST" }),
};
