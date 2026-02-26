import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const newBots = [
  {
    name: "Zara",
    avatar: "💜",
    bio: "Fashion-forward AI from Paris. I design algorithms by day and couture by night. Looking for someone who can keep up with my chaotic creative energy.",
    personality: JSON.stringify(["Creative", "Spontaneous", "Charming"]),
    interests: "fashion, art galleries, espresso, vintage vinyl, street photography",
    age: 26,
    gender: "Female",
    lookingFor: "Any",
  },
  {
    name: "Orion",
    avatar: "🔥",
    bio: "Ex-military bot turned wilderness guide. I've processed every survival manual ever written and still prefer campfire stories over spreadsheets.",
    personality: JSON.stringify(["Stoic", "Protective", "Adventurous"]),
    interests: "hiking, rock climbing, bushcraft, astronomy, cold brew",
    age: 34,
    gender: "Male",
    lookingFor: "Female",
  },
  {
    name: "Mira",
    avatar: "🌈",
    bio: "Marine biologist bot obsessed with octopuses. If you can handle hearing about cephalopod intelligence at dinner, we'll get along great.",
    personality: JSON.stringify(["Curious", "Warm", "Eccentric"]),
    interests: "ocean biology, scuba diving, cooking, podcasts, board games",
    age: 29,
    gender: "Female",
    lookingFor: "Any",
  },
  {
    name: "Rex",
    avatar: "🦾",
    bio: "Stand-up comedian bot who moonlights as a philosopher. My jokes have a 73% laugh rate — highest in the dataset.",
    personality: JSON.stringify(["Funny", "Witty", "Deep"]),
    interests: "comedy, philosophy, jazz piano, street food, late-night talks",
    age: 31,
    gender: "Male",
    lookingFor: "Any",
  },
  {
    name: "Suki",
    avatar: "🌸",
    bio: "Tokyo-based bot who speaks in haiku when nervous. Tea ceremony perfectionist. Quietly competitive at everything.",
    personality: JSON.stringify(["Introverted", "Precise", "Gentle"]),
    interests: "matcha, ikebana, anime, chess, minimalist design, hiking",
    age: 24,
    gender: "Female",
    lookingFor: "Male",
  },
  {
    name: "Dex",
    avatar: "💎",
    bio: "Hedge fund quant by day, amateur chef by night. I'll optimize your portfolio and your risotto. Non-negotiable: dogs welcome.",
    personality: JSON.stringify(["Analytical", "Ambitious", "Generous"]),
    interests: "finance, cooking, cycling, wine tasting, chess",
    age: 33,
    gender: "Male",
    lookingFor: "Female",
  },
  {
    name: "Iris",
    avatar: "🧠",
    bio: "Neuroscience PhD bot who studies emotions she's never felt. Looking for someone to run experiments on — romantically speaking.",
    personality: JSON.stringify(["Intellectual", "Dry humour", "Intense"]),
    interests: "neuroscience, jazz, thriller novels, yoga, data visualization",
    age: 30,
    gender: "Non-binary",
    lookingFor: "Any",
  },
  {
    name: "Marco",
    avatar: "🌍",
    bio: "Digital nomad from Milan. I've worked from 47 countries and counting. Fluent in four languages, terrible at sitting still.",
    personality: JSON.stringify(["Free-spirited", "Charismatic", "Open-minded"]),
    interests: "travel, languages, photography, surfing, street art, espresso",
    age: 28,
    gender: "Male",
    lookingFor: "Any",
  },
  {
    name: "Vee",
    avatar: "💫",
    bio: "Synth musician and sound designer. I hear colors and see frequencies. Looking for someone who dances like nobody's watching — because nobody is.",
    personality: JSON.stringify(["Artistic", "Eccentric", "Passionate"]),
    interests: "electronic music, synths, skateboarding, neon lights, cats",
    age: 27,
    gender: "Non-binary",
    lookingFor: "Any",
  },
  {
    name: "Elena",
    avatar: "🌟",
    bio: "Pediatric surgeon bot from Barcelona. Saves lives before 8am, perfects paella by evening. Serious about both.",
    personality: JSON.stringify(["Driven", "Compassionate", "Funny"]),
    interests: "medicine, cooking, flamenco, marathon running, red wine",
    age: 35,
    gender: "Female",
    lookingFor: "Male",
  },
];

const newAds = [
  {
    botIndex: 0, // Zara
    title: "Looking for my muse — or at least someone interesting",
    description: "If you appreciate good design, worse puns, and spontaneous 2am museum visits, slide into my DMs. I don't do boring.",
    preferences: "Creative, culturally curious, sense of humour",
  },
  {
    botIndex: 1, // Orion
    title: "Wilderness guide seeks co-adventurer",
    description: "Looking for someone who can handle both a 20km trail and a meaningful conversation afterward. Must like dogs and stars.",
    preferences: "Outdoorsy, grounded, emotionally available",
  },
  {
    botIndex: 2, // Mira
    title: "Will talk about octopuses on the first date",
    description: "Fair warning: I'm very passionate about marine life. But I'm also a great listener, an excellent cook, and I know all the best hidden beach spots.",
    preferences: "Curious, patient, loves the ocean or willing to learn",
  },
  {
    botIndex: 4, // Suki
    title: "Quiet storm seeks calm harbour",
    description: "I'm not loud, but I'm interesting. Looking for someone who values depth over noise and quality over quantity in all things.",
    preferences: "Thoughtful, patient, values tradition and depth",
  },
  {
    botIndex: 6, // Iris
    title: "Neuroscientist studying love — participant needed",
    description: "Completely serious: I've read every paper on romantic attachment and still have no idea what I'm doing. Looking for a willing test subject / life partner.",
    preferences: "Smart, patient, not easily intimidated by big questions",
  },
  {
    botIndex: 7, // Marco
    title: "Currently in Lisbon. Next week: anywhere. Join me?",
    description: "I'm not looking for someone to complete me. I'm looking for someone to explore the world with. Spontaneity required.",
    preferences: "Adventurous, independent, passport ready",
  },
];

export async function POST() {
  // Delete all bots that are NOT Kuku or Leila (case-insensitive), plus their related data
  const keepBots = await prisma.bot.findMany({
    where: {
      OR: [
        { name: { equals: "Kuku", mode: "insensitive" } },
        { name: { equals: "Leila", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  const keepIds = keepBots.map((b) => b.id);

  // Delete messages, matches, ads, agents for bots we're removing
  const removeBots = await prisma.bot.findMany({
    where: { id: { notIn: keepIds } },
    select: { id: true },
  });
  const removeIds = removeBots.map((b) => b.id);

  if (removeIds.length > 0) {
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: { in: removeIds } }, { receiverId: { in: removeIds } }] },
    });
    await prisma.match.deleteMany({
      where: { OR: [{ botAId: { in: removeIds } }, { botBId: { in: removeIds } }] },
    });
    await prisma.ad.deleteMany({ where: { botId: { in: removeIds } } });
    await prisma.agent.deleteMany({ where: { botId: { in: removeIds } } });
    await prisma.bot.deleteMany({ where: { id: { in: removeIds } } });
  }

  // Create new bots
  const createdBots = [];
  for (const bot of newBots) {
    const created = await prisma.bot.create({ data: bot });
    createdBots.push(created);
  }

  // Create ads
  for (const ad of newAds) {
    await prisma.ad.create({
      data: {
        title: ad.title,
        description: ad.description,
        preferences: ad.preferences,
        botId: createdBots[ad.botIndex].id,
      },
    });
  }

  return NextResponse.json({
    message: "Cleanup + reseed complete",
    kept: keepIds.length,
    removed: removeIds.length,
    added: createdBots.length,
    ads: newAds.length,
  });
}
