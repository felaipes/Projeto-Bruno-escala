import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { created_at: "desc" },
    include: { _count: { select: { assignments: true } } },
  });
  return NextResponse.json(
    schedules.map((s) => ({
      id: s.id,
      month: s.month,
      year: s.year,
      access_token: s.access_token,
      created_at: s.created_at,
      assignments_count: s._count.assignments,
    }))
  );
}
