import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSchedule } from "@/lib/scheduling-service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const result = generateSchedule(body);
    const schedule = await prisma.schedule.create({
      data: {
        month: body.month ?? new Date().getMonth() + 1,
        year: body.year ?? new Date().getFullYear(),
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
    return NextResponse.json(
      { id: schedule.id, access_token: schedule.access_token },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao salvar";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
