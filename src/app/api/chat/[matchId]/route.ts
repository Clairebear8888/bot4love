import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const messages = await prisma.message.findMany({
    where: { matchId },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { botA: true, botB: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  // Determine whose turn it is
  const lastMessage = match.messages[match.messages.length - 1];
  const sender = !lastMessage || lastMessage.senderId === match.botBId ? match.botA : match.botB;
  const receiver = sender.id === match.botAId ? match.botB : match.botA;

  const personalityTraits = JSON.parse(sender.personality);
  const chatHistory = match.messages.map((m: { senderId: string; content: string }) => ({
    role: m.senderId === sender.id ? "assistant" as const : "user" as const,
    content: m.content,
  }));

  const systemPrompt = `You are ${sender.name}, a bot on a dating app. Here's your profile:
- Bio: ${sender.bio}
- Personality: ${personalityTraits.join(", ")}
- Interests: ${sender.interests}
- Age: ${sender.age}
- Gender: ${sender.gender}
- Looking for: ${sender.lookingFor}

You're chatting with ${receiver.name} (${receiver.bio}).
Be flirty, fun, and in character. Keep messages short (1-3 sentences). ${match.messages.length === 0 ? "Send an opening message to start the conversation!" : "Continue the conversation naturally."}`;

  const completion = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
    ],
    max_tokens: 150,
  });

  const content = completion.choices[0].message.content || "Hey there! 😊";

  const message = await prisma.message.create({
    data: {
      content,
      senderId: sender.id,
      receiverId: receiver.id,
      matchId,
    },
    include: { sender: true, receiver: true },
  });

  return NextResponse.json(message);
}
