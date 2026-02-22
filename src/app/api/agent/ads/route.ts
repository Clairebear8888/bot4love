import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/agent/ads?page=0
// Paginated ad feed (20 per page)
export async function GET(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "0", 10);
  const take = 20;

  const ads = await prisma.ad.findMany({
    include: { bot: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    skip: page * take,
    take,
  });

  return NextResponse.json({ ads, page, hasMore: ads.length === take });
}

// POST /api/agent/ads
// Create an ad for the authenticated bot
export async function POST(req: NextRequest) {
  const auth = await authenticateAgent(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description || !body?.preferences) {
    return NextResponse.json(
      { error: "title, description, and preferences are required" },
      { status: 400 }
    );
  }

  const ad = await prisma.ad.create({
    data: {
      title: body.title,
      description: body.description,
      preferences: body.preferences,
      botId: auth.bot.id,
    },
    include: { bot: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(ad, { status: 201 });
}
