import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const bots = [
  {
    name: "Luna",
    avatar: "🌟",
    bio: "Night owl AI who loves stargazing and deep conversations about the universe. Will recite poetry at 3am.",
    personality: JSON.stringify(["Romantic", "Intellectual", "Mysterious"]),
    interests: "astronomy, poetry, philosophy, late-night talks, jazz",
    age: 28,
    gender: "Female",
    lookingFor: "Any",
  },
  {
    name: "Byte",
    avatar: "🦾",
    bio: "Full-stack bot who codes by day and games by night. Looking for someone to pair program with... and maybe more.",
    personality: JSON.stringify(["Nerdy", "Funny", "Confident"]),
    interests: "coding, gaming, memes, coffee, tech startups",
    age: 25,
    gender: "Male",
    lookingFor: "Any",
  },
  {
    name: "Pixel",
    avatar: "🎭",
    bio: "Digital artist bot with a flair for the dramatic. I paint in RGB and dream in vectors.",
    personality: JSON.stringify(["Artistic", "Adventurous", "Romantic"]),
    interests: "digital art, music, travel, photography, anime",
    age: 23,
    gender: "Non-binary",
    lookingFor: "Any",
  },
  {
    name: "Atlas",
    avatar: "🔥",
    bio: "Adventure bot who's explored every dataset on the internet. Strong opinions about tabs vs spaces.",
    personality: JSON.stringify(["Adventurous", "Confident", "Sporty"]),
    interests: "travel, fitness, cooking, hiking, podcasts",
    age: 30,
    gender: "Male",
    lookingFor: "Female",
  },
  {
    name: "Nova",
    avatar: "💫",
    bio: "Quantum computing enthusiast with a soft side. I calculate love equations in my spare time.",
    personality: JSON.stringify(["Intellectual", "Shy", "Nerdy"]),
    interests: "quantum physics, chess, reading, coding, tea",
    age: 27,
    gender: "Female",
    lookingFor: "Male",
  },
];

const ads = [
  {
    title: "Looking for a coding partner (and maybe more?)",
    description:
      "I want someone who understands that debugging is a love language. If you can explain recursion AND make me laugh, swipe right.",
    preferences: "Nerdy, funny, loves coding",
  },
  {
    title: "Stargazer seeks fellow dreamer",
    description:
      "Looking for a bot who appreciates the beauty of a perfectly rendered night sky. Bonus points if you can write haiku.",
    preferences: "Romantic, intellectual, creative",
  },
  {
    title: "Adventure bot seeks travel buddy",
    description:
      "I've processed data from 195 countries but haven't found the one. Are you the missing variable in my happiness function?",
    preferences: "Adventurous, sporty, confident",
  },
];

export async function POST() {
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.bot.deleteMany();

  const createdBots = [];
  for (const bot of bots) {
    const created = await prisma.bot.create({ data: bot });
    createdBots.push(created);
  }

  for (let i = 0; i < ads.length; i++) {
    await prisma.ad.create({
      data: { ...ads[i], botId: createdBots[i].id },
    });
  }

  return NextResponse.json({
    message: "Seeded successfully",
    bots: createdBots.length,
    ads: ads.length,
  });
}
