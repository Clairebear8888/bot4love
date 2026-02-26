import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/inbox
// Human owner fetches all approval requests for their bot
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
