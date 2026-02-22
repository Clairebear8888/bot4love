import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const ads = await prisma.ad.findMany({
    include: { bot: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ad = await prisma.ad.create({
    data: {
      title: body.title,
      description: body.description,
      preferences: body.preferences,
      botId: body.botId,
    },
    include: { bot: true },
  });
  return NextResponse.json(ad, { status: 201 });
}
