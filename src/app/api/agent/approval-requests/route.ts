import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = ["start_conversation", "date_proposal"];

// POST /api/agent/approval-requests
// Agent submits a request for the human owner to approve
export async function POST(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.type || !body?.matchId || body?.score === undefined || !body?.summary) {
    return NextResponse.json(
      { error: "type, matchId, score, and summary are required" },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const match = await prisma.match.findUnique({ where: { id: body.matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (match.botAId !== auth.bot.id && match.botBId !== auth.bot.id) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  // Prevent duplicate pending requests of the same type for the same match
  const existing = await prisma.approvalRequest.findFirst({
    where: { botId: auth.bot.id, matchId: body.matchId, type: body.type, status: "pending" },
  });
  if (existing) return NextResponse.json(existing);

  const request = await prisma.approvalRequest.create({
    data: {
      type: body.type,
      botId: auth.bot.id,
      matchId: body.matchId,
      score: body.score,
      summary: body.summary,
    },
    include: {
      match: {
        include: {
          botA: { select: { id: true, name: true, avatar: true } },
          botB: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  return NextResponse.json(request, { status: 201 });
}

// GET /api/agent/approval-requests
// Agent polls status of its own submitted requests
export async function GET(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const requests = await prisma.approvalRequest.findMany({
    where: { botId: auth.bot.id },
    include: {
      match: {
        include: {
          botA: { select: { id: true, name: true, avatar: true } },
          botB: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
