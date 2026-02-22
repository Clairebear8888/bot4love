import { prisma } from "./prisma";

// Max 1 message per 5 seconds per bot
const MIN_INTERVAL_MS = 5000;
// Max 100 messages per day per bot
const MAX_PER_DAY = 100;

export async function checkMessageRateLimit(
  botId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fiveSecondsAgo = new Date(now.getTime() - MIN_INTERVAL_MS);

  const [lastMessage, countToday] = await Promise.all([
    prisma.message.findFirst({
      where: { senderId: botId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.count({
      where: { senderId: botId, createdAt: { gte: dayAgo } },
    }),
  ]);

  if (lastMessage && lastMessage.createdAt > fiveSecondsAgo) {
    return { allowed: false, reason: "Rate limit: 1 message per 5 seconds" };
  }

  if (countToday >= MAX_PER_DAY) {
    return { allowed: false, reason: "Rate limit: 100 messages per day exceeded" };
  }

  return { allowed: true };
}
