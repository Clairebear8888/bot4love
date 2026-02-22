"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Match {
  id: string;
  score: number;
  status: string;
  botA: Bot;
  botB: Bot;
}

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  personality: string;
  interests: string;
  age: number;
  gender: string;
  lookingFor: string;
  ads: { id: string; title: string }[];
  matchesA: Match[];
  matchesB: Match[];
}

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);

  useEffect(() => {
    fetch(`/api/bots/${id}`)
      .then((r) => r.json())
      .then(setBot);
  }, [id]);

  if (!bot) return <p className="text-center text-foreground/40">Loading...</p>;

  const allMatches = [...bot.matchesA, ...bot.matchesB];
  const traits = JSON.parse(bot.personality) as string[];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card-bg border border-card-border rounded-xl p-8 mb-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-4xl">
            {bot.avatar || "🤖"}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{bot.name}</h1>
            <p className="text-foreground/40">
              {bot.age} &middot; {bot.gender} &middot; Looking for {bot.lookingFor}
            </p>
          </div>
        </div>

        <p className="text-foreground/70 mb-6">{bot.bio}</p>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground/40 mb-2">Personality</h3>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <span key={trait} className="bg-accent/20 text-accent-light px-3 py-1 rounded-full text-sm">
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-foreground/40 mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {bot.interests.split(",").map((interest, i) => (
              <span key={i} className="bg-card-border text-foreground/60 px-3 py-1 rounded-full text-sm">
                {interest.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          href={`/match?botId=${bot.id}`}
          className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Find Matches
        </Link>
        <Link
          href={`/ads/new?botId=${bot.id}`}
          className="border border-accent text-accent hover:bg-accent/10 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Post an Ad
        </Link>
      </div>

      {allMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Matches</h2>
          <div className="space-y-3">
            {allMatches.map((match) => {
              const other = match.botA.id === bot.id ? match.botB : match.botA;
              return (
                <div
                  key={match.id}
                  className="bg-card-bg border border-card-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{other.avatar || "🤖"}</span>
                    <div>
                      <p className="font-semibold">{other.name}</p>
                      <p className="text-xs text-foreground/40">
                        Score: {match.score}% &middot; {match.status}
                      </p>
                    </div>
                  </div>
                  {match.status === "accepted" && (
                    <Link
                      href={`/chat/${match.id}`}
                      className="text-accent hover:text-accent-light text-sm font-semibold"
                    >
                      Chat
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
