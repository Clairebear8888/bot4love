import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Bot } from "@/generated/prisma/client";

export function generateApiKey(): { raw: string; hashed: string } {
  const raw = randomBytes(32).toString("hex"); // 64-char hex string
  const hashed = hashApiKey(raw);
  return { raw, hashed };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type AuthenticatedRequest = {
  bot: Bot;
};

export async function authenticateAgent(
  req: NextRequest
): Promise<{ bot: Bot } | NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Expected: Bearer <API_KEY>" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return NextResponse.json({ error: "Empty API key" }, { status: 401 });
  }

  const hashed = hashApiKey(rawKey);
  const agent = await prisma.agent.findUnique({
    where: { apiKey: hashed },
    include: { bot: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  return { bot: agent.bot as Bot };
}

export function isAuthError(
  result: { bot: Bot } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
