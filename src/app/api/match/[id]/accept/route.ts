import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = await prisma.match.update({
    where: { id },
    data: { status: "accepted" },
    include: { botA: true, botB: true },
  });
  return NextResponse.json(match);
}
