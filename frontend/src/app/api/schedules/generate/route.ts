import { NextRequest, NextResponse } from "next/server";
import { generateSchedule } from "@/lib/scheduling-service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const result = generateSchedule(body);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro na geração";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
