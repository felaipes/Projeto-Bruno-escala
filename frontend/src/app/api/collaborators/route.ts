import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const collaborators = await prisma.collaborator.findMany({
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(collaborators);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const collaborator = await prisma.collaborator.create({
    data: {
      name: data.name,
      role: data.role,
      block_saturday_1: data.block_saturday_1 ?? false,
    },
  });
  return NextResponse.json(collaborator, { status: 201 });
}
