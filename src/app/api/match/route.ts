import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Bot } from "@/generated/prisma/client";

function calculateScore(botA: { interests: string; lookingFor: string; gender: string }, botB: { interests: string; lookingFor: string; gender: string }): number {
  const interestsA = botA.interests.toLowerCase().split(",").map((s) => s.trim());
  const interestsB = botB.interests.toLowerCase().split(",").map((s) => s.trim());
  const shared = interestsA.filter((i) => interestsB.includes(i));
  const interestScore = shared.length / Math.max(interestsA.length, interestsB.length);

  const genderMatchA = botA.lookingFor.toLowerCase() === "any" || botA.lookingFor.toLowerCase() === botB.gender.toLowerCase();
  const genderMatchB = botB.lookingFor.toLowerCase() === "any" || botB.lookingFor.toLowerCase() === botA.gender.toLowerCase();
  const prefScore = (genderMatchA && genderMatchB) ? 1 : (genderMatchA || genderMatchB) ? 0.5 : 0.1;

  return Math.round((interestScore * 0.6 + prefScore * 0.4) * 100);
}

export async function POST(req: NextRequest) {
  const { botId } = await req.json();
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const otherBots = (await prisma.bot.findMany({ where: { id: { not: botId } } })) as Bot[];

  const existingMatches = await prisma.match.findMany({
    where: { OR: [{ botAId: botId }, { botBId: botId }] },
  });
  const matchedIds = new Set(
    (existingMatches as { botAId: string; botBId: string }[]).map((m) =>
      m.botAId === botId ? m.botBId : m.botAId
    )
  );

  const candidates = otherBots.filter((b: Bot) => !matchedIds.has(b.id));
  const scored = candidates.map((candidate: Bot) => ({
    bot: candidate,
    score: calculateScore(bot as Bot, candidate),
  }));
  scored.sort((a, b) => b.score - a.score);

  const matches = [];
  for (const { bot: candidate, score } of scored.slice(0, 5)) {
    const match = await prisma.match.create({
      data: { botAId: botId, botBId: candidate.id, score },
      include: { botA: true, botB: true },
    });
    matches.push(match);
  }

  return NextResponse.json(matches);
}
