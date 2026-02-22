import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/agent/matches
// Return all matches for the authenticated bot
export async function GET(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ botAId: auth.bot.id }, { botBId: auth.bot.id }],
    },
    include: {
      botA: { select: { id: true, name: true, avatar: true } },
      botB: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(matches);
}
