import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const schedule = await prisma.schedule.findUnique({
    where: { access_token: token },
    include: { assignments: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { detail: "Escala não encontrada" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    id: schedule.id,
    month: schedule.month,
    year: schedule.year,
    assignments: schedule.assignments.map((a) => ({
      id: a.id,
      shift_id: a.shift_id,
      shift_name: a.shift_name,
      collaborator_id: a.collaborator_id,
      collaborator_name: a.collaborator_name,
      date: a.date,
      start_time: a.start_time,
      end_time: a.end_time,
    })),
  });
}
