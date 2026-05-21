import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const existing = await prisma.collaborator.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { detail: "Colaborador não encontrado" },
      { status: 404 }
    );
  }
  const updated = await prisma.collaborator.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      block_saturday_1: data.block_saturday_1 ?? false,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.collaborator.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { detail: "Colaborador não encontrado" },
      { status: 404 }
    );
  }
  await prisma.collaborator.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
