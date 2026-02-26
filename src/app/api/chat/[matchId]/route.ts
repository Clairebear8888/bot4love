import { prisma } from "@/lib/prisma";
import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/chat/:matchId
// Returns messages for a match — requires the requesting bot to be a participant.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const authResult = await authenticateAgent(req);
  if (isAuthError(authResult)) return authResult;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (authResult.bot.id !== match.botAId && authResult.bot.id !== match.botBId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}
