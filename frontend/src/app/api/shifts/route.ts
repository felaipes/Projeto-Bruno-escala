import { NextRequest, NextResponse } from "next/server";

// Shifts are managed client-side as templates (DEFAULT_SHIFTS).
// These endpoints exist for API compatibility.

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  return NextResponse.json(
    { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() },
    { status: 201 }
  );
}
