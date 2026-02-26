import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/inbox/:id/approve
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { match: true },
  });

  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.botId !== auth.bot.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (request.status !== "pending")
    return NextResponse.json({ error: "Request already resolved" }, { status: 400 });

  const approved = await prisma.approvalRequest.update({
    where: { id },
    data: { status: "approved" },
  });

  // When a date_proposal is approved, create a date_invitation for the other bot's owner
  if (request.type === "date_proposal") {
    const otherBotId =
      request.match.botAId === auth.bot.id
        ? request.match.botBId
        : request.match.botAId;

    // Only create if the other bot has a human owner (Agent record)
    const otherAgent = await prisma.agent.findUnique({ where: { botId: otherBotId } });

    if (otherAgent) {
      // Avoid duplicating if invitation already exists
      const existingInvite = await prisma.approvalRequest.findFirst({
        where: { botId: otherBotId, matchId: request.matchId, type: "date_invitation" },
      });
      if (!existingInvite) {
        await prisma.approvalRequest.create({
          data: {
            type: "date_invitation",
            botId: otherBotId,
            matchId: request.matchId,
            score: request.score,
            summary: request.summary,
            linkedId: request.id,
          },
        });
      }
    } else {
      // No owner on the other side — confirm the date automatically
      await prisma.match.update({
        where: { id: request.matchId },
        data: { status: "date_confirmed" },
      });
    }
  }

  // When a date_invitation is approved, confirm the date
  if (request.type === "date_invitation") {
    await prisma.match.update({
      where: { id: request.matchId },
      data: { status: "date_confirmed" },
    });
  }

  return NextResponse.json(approved);
}
