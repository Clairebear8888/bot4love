import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bot = await prisma.bot.findUnique({
    where: { id },
    include: {
      ads: true,
      matchesA: { include: { botB: true } },
      matchesB: { include: { botA: true } },
    },
  });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bot);
}
