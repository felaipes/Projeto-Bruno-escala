import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { month, year } = await request.json();
  const schedule = await prisma.schedule.create({
    data: { month, year },
  });
  return NextResponse.json(
    { id: schedule.id, access_token: schedule.access_token },
    { status: 201 }
  );
}
