import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const bots = await prisma.bot.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(bots);
  } catch (e) {
    console.error("[GET /api/bots]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bot = await prisma.bot.create({
      data: {
        name: body.name,
        avatar: body.avatar || null,
        bio: body.bio,
        personality: body.personality,
        interests: body.interests,
        age: body.age,
        gender: body.gender,
        lookingFor: body.lookingFor,
        skillConfig: body.skillConfig || null,
      },
    });
    return NextResponse.json(bot, { status: 201 });
  } catch (e) {
    console.error("[POST /api/bots]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
