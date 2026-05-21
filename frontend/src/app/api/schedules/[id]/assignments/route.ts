import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) {
    return NextResponse.json(
      { detail: "Escala não encontrada" },
      { status: 404 }
    );
  }
  const data = await request.json();
  const assignment = await prisma.assignment.create({
    data: {
      schedule_id: id,
      collaborator_id: data.collaborator_id,
      collaborator_name: data.collaborator_name,
      shift_id: data.shift_id,
      shift_name: data.shift_name,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
