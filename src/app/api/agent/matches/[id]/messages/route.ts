import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { checkMessageRateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

// GET /api/agent/matches/:id/messages
// Fetch all messages in a match (bot must be a participant)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.botAId !== auth.bot.id && match.botBId !== auth.bot.id) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { matchId: id },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/agent/matches/:id/messages
// Send a message in a match
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.botAId !== auth.bot.id && match.botBId !== auth.bot.id) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  // Rate limiting
  const rateCheck = await checkMessageRateLimit(auth.bot.id);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const receiverId = match.botAId === auth.bot.id ? match.botBId : match.botAId;

  const message = await prisma.message.create({
    data: {
      content: body.content.trim(),
      senderId: auth.bot.id,
      receiverId,
      matchId: id,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
