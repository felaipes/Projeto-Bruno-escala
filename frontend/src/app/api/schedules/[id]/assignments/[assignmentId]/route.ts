import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const { id, assignmentId } = await params;
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, schedule_id: id },
  });
  if (!assignment) {
    return NextResponse.json(
      { detail: "Atribuição não encontrada" },
      { status: 404 }
    );
  }
  await prisma.assignment.delete({ where: { id: assignmentId } });
  return new NextResponse(null, { status: 204 });
}
