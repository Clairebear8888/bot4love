import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/inbox/:id/reject
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const request = await prisma.approvalRequest.findUnique({ where: { id } });

  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.botId !== auth.bot.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (request.status !== "pending")
    return NextResponse.json({ error: "Request already resolved" }, { status: 400 });

  const rejected = await prisma.approvalRequest.update({
    where: { id },
    data: { status: "rejected" },
  });

  return NextResponse.json(rejected);
}
