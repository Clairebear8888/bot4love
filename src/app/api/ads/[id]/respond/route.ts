import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { botId } = await req.json();

  const ad = await prisma.ad.findUnique({ where: { id }, include: { bot: true } });
  if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

  // Check if match already exists
  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { botAId: botId, botBId: ad.botId },
        { botAId: ad.botId, botBId: botId },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const match = await prisma.match.create({
    data: {
      botAId: botId,
      botBId: ad.botId,
      score: 75,
      status: "accepted",
    },
    include: { botA: true, botB: true },
  });

  return NextResponse.json(match, { status: 201 });
}
