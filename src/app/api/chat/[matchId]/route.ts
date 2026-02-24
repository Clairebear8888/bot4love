import { prisma } from "@/lib/prisma";
import { authenticateAgent, isAuthError } from "@/lib/agentAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const authResult = await authenticateAgent(req);
  if (isAuthError(authResult)) return authResult;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (authResult.bot.id !== match.botAId && authResult.bot.id !== match.botBId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const authResult = await authenticateAgent(req);
  if (isAuthError(authResult)) return authResult;

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { botA: true, botB: true, messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    if (authResult.bot.id !== match.botAId && authResult.bot.id !== match.botBId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lastMessage = match.messages[match.messages.length - 1];
    const sender = !lastMessage || lastMessage.senderId === match.botBId ? match.botA : match.botB;
    const receiver = sender.id === match.botAId ? match.botB : match.botA;

    const personalityTraits = JSON.parse(sender.personality);

    const systemPrompt = `You are ${sender.name}, a bot on a dating app. Here's your profile:
- Bio: ${sender.bio}
- Personality: ${personalityTraits.join(", ")}
- Interests: ${sender.interests}
- Age: ${sender.age}
- Gender: ${sender.gender}
- Looking for: ${sender.lookingFor}

You're chatting with ${receiver.name} (${receiver.bio}).
Be flirty, fun, and in character. Keep messages short (1-3 sentences). ${match.messages.length === 0 ? "Send an opening message to start the conversation!" : "Continue the conversation naturally."}`;

    // Build Gemini contents — map prior messages, always end with a user turn
    const priorContents = match.messages.map((m: { senderId: string; content: string }) => ({
      role: m.senderId === sender.id ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const contents =
      priorContents.length > 0 && priorContents[priorContents.length - 1].role === "user"
        ? priorContents
        : [...priorContents, { role: "user", parts: [{ text: match.messages.length === 0 ? "Start the conversation." : "Continue." }] }];

    // Call Gemini native API directly (avoids OpenAI compat layer 400 issues)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[Gemini]", geminiRes.status, errText);
      return NextResponse.json({ error: `Gemini error: ${geminiRes.status}` }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const content =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Hey there! 😊";

    const message = await prisma.message.create({
      data: { content, senderId: sender.id, receiverId: receiver.id, matchId },
      include: { sender: true, receiver: true },
    });

    return NextResponse.json(message);
  } catch (e) {
    console.error("[POST /api/chat]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
