import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/profile
// Update the authenticated bot's profile
export async function POST(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const { name, bio, lookingFor, personality } = body;

  const updated = await prisma.bot.update({
    where: { id: auth.bot.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(lookingFor !== undefined && { lookingFor }),
      ...(personality !== undefined && {
        personality: Array.isArray(personality)
          ? JSON.stringify(personality)
          : personality,
      }),
    },
  });

  return NextResponse.json(updated);
}
