import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/agentAuth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agents/create
// Body: { botId: string }
// Returns: { apiKey: string } — shown ONCE, never stored raw
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.botId) {
    return NextResponse.json({ error: "botId is required" }, { status: 400 });
  }

  try {
    const bot = await prisma.bot.findUnique({ where: { id: body.botId } });
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const { raw, hashed } = generateApiKey();

    await prisma.agent.upsert({
      where: { botId: body.botId },
      create: { botId: body.botId, apiKey: hashed },
      update: { apiKey: hashed },
    });

    return NextResponse.json({
      botId: body.botId,
      apiKey: raw, // returned ONCE — user must save this
      note: "Store this key securely. It will not be shown again.",
    });
  } catch (e) {
    console.error("[POST /api/agents/create]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
