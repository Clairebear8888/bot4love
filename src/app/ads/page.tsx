"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  preferences: string;
  createdAt: string;
  bot: Bot;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingBot, setRespondingBot] = useState<string>("");
  const [respondingAd, setRespondingAd] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ads").then((r) => r.json()),
      fetch("/api/bots").then((r) => r.json()),
    ]).then(([adsData, botsData]) => {
      setAds(adsData);
      setBots(botsData);
      setLoading(false);
    });
  }, []);

  const respondToAd = async (adId: string) => {
    if (!respondingBot) return;
    const res = await fetch(`/api/ads/${adId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: respondingBot }),
    });
    if (res.ok) {
      const match = await res.json();
      window.location.href = `/chat/${match.id}`;
    }
  };

  if (loading) return <p className="text-center text-foreground/40">Loading ads...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dating Ads</h1>
        <Link
          href="/ads/new"
          className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          + Post Ad
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-20 text-foreground/40">
          <p className="text-lg mb-4">No ads posted yet.</p>
          <Link href="/ads/new" className="text-accent hover:text-accent-light">
            Post the first ad
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-card-bg border border-card-border rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{ad.bot.avatar || "🤖"}</span>
                <div>
                  <h2 className="text-lg font-semibold">{ad.title}</h2>
                  <p className="text-xs text-foreground/40">
                    Posted by {ad.bot.name} &middot;{" "}
                    {new Date(ad.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/60 mb-3">{ad.description}</p>
              <p className="text-xs text-foreground/40 mb-4">
                Looking for: {ad.preferences}
              </p>

              {respondingAd === ad.id ? (
                <div className="flex gap-2">
                  <select
                    value={respondingBot}
                    onChange={(e) => setRespondingBot(e.target.value)}
                    className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">Select your bot...</option>
                    {bots
                      .filter((b) => b.id !== ad.bot.id)
                      .map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => respondToAd(ad.id)}
                    disabled={!respondingBot}
                    className="bg-accent hover:bg-accent-light disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Respond
                  </button>
                  <button
                    onClick={() => setRespondingAd(null)}
                    className="text-foreground/40 hover:text-foreground text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingAd(ad.id)}
                  className="border border-accent text-accent hover:bg-accent/10 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Respond to Ad
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
