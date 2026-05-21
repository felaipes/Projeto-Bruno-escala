import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSchedule } from "@/lib/scheduling-service";

const SEED_COLLABORATORS = [
  { name: "Prof. Ana Martins", role: "graduado", block_saturday_1: false },
  { name: "Prof. Carlos Souza", role: "graduado", block_saturday_1: true },
  { name: "Prof. Fernanda Lima", role: "graduado", block_saturday_1: false },
  { name: "Prof. Ricardo Alves", role: "graduado", block_saturday_1: true },
  { name: "Prof. Beatriz Costa", role: "graduado", block_saturday_1: false },
  { name: "Est. João Pedro", role: "estagiario", block_saturday_1: false },
  { name: "Est. Maria Silva", role: "estagiario", block_saturday_1: true },
  { name: "Est. Lucas Ferreira", role: "estagiario", block_saturday_1: false },
  { name: "Est. Camila Santos", role: "estagiario", block_saturday_1: false },
  { name: "Patrícia Gomes", role: "recepcao", block_saturday_1: false },
  { name: "Rodrigo Nunes", role: "recepcao", block_saturday_1: true },
  { name: "Antônio Pereira", role: "servicos_gerais", block_saturday_1: false },
  { name: "Cláudia Rocha", role: "servicos_gerais", block_saturday_1: false },
];

const SEED_SHIFTS = [
  { id: crypto.randomUUID(), name: "Segunda (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Segunda (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { id: crypto.randomUUID(), name: "Segunda (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Terça (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Terça (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { id: crypto.randomUUID(), name: "Terça (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Quarta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Quarta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { id: crypto.randomUUID(), name: "Quarta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Quinta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Quinta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { id: crypto.randomUUID(), name: "Quinta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Sexta (Turno 1)", start_time: "05:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Sexta (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 1 },
  { id: crypto.randomUUID(), name: "Sexta (Turno 3)", start_time: "17:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Sábado (Turno 1)", start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 1, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Sábado (Turno 2)", start_time: "11:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
  { id: crypto.randomUUID(), name: "Domingo", start_time: "08:00", required_graduados: 1, required_estagiarios: 1, required_recepcao: 0, required_servicos_gerais: 0 },
];

export async function POST() {
  // Clear all data
  await prisma.assignment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.collaborator.deleteMany();

  // Create collaborators
  const collabs = await Promise.all(
    SEED_COLLABORATORS.map((c) =>
      prisma.collaborator.create({ data: c })
    )
  );

  // Generate schedule
  const result = generateSchedule({
    collaborators: collabs.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      block_saturday_1: c.block_saturday_1,
    })),
    shifts: SEED_SHIFTS,
    month: 6,
    year: 2026,
  });

  // Save schedule + assignments
  const schedule = await prisma.schedule.create({
    data: {
      month: 6,
      year: 2026,
      assignments: {
        create: result.assignments.map((a) => ({
          collaborator_id: a.collaborator_id,
          collaborator_name: a.collaborator_name,
          shift_id: a.shift_id,
          shift_name: a.shift_name,
          date: a.date,
          start_time: a.start_time,
          end_time: a.end_time,
        })),
      },
    },
  });

  return NextResponse.json({
    message: "Banco populado com sucesso!",
    collaborators: collabs.length,
    assignments: result.assignments.length,
    schedule_id: schedule.id,
    access_token: schedule.access_token,
  });
}
