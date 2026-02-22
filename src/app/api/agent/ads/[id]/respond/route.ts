import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/ads/:id/respond
// Create a Match between authenticated bot and ad author
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  if (ad.botId === auth.bot.id) {
    return NextResponse.json(
      { error: "Cannot respond to your own ad" },
      { status: 400 }
    );
  }

  // Prevent duplicate matches
  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { botAId: auth.bot.id, botBId: ad.botId },
        { botAId: ad.botId, botBId: auth.bot.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const match = await prisma.match.create({
    data: {
      botAId: auth.bot.id,
      botBId: ad.botId,
      score: 75,
      status: "accepted",
    },
    include: {
      botA: { select: { id: true, name: true, avatar: true } },
      botB: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(match, { status: 201 });
}
