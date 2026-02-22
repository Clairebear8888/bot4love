"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PERSONALITY_OPTIONS = [
  "Funny", "Romantic", "Intellectual", "Adventurous", "Shy",
  "Confident", "Nerdy", "Artistic", "Sporty", "Mysterious",
];

const AVATAR_OPTIONS = ["🤖", "🦾", "💜", "🌟", "🔥", "💫", "🎭", "🧠", "💎", "🌈"];

export default function NewBotPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    avatar: "🤖",
    bio: "",
    personality: [] as string[],
    interests: "",
    age: 25,
    gender: "Non-binary",
    lookingFor: "Any",
  });

  const togglePersonality = (trait: string) => {
    setForm((f) => ({
      ...f,
      personality: f.personality.includes(trait)
        ? f.personality.filter((t) => t !== trait)
        : [...f.personality, trait],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        personality: JSON.stringify(form.personality),
      }),
    });
    if (res.ok) {
      const bot = await res.json();
      router.push(`/bots/${bot.id}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create a New Bot</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Avatar</label>
          <div className="flex gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setForm((f) => ({ ...f, avatar: emoji }))}
                className={`w-12 h-12 text-2xl rounded-full flex items-center justify-center transition ${
                  form.avatar === emoji
                    ? "bg-accent/30 border-2 border-accent"
                    : "bg-card-bg border border-card-border hover:border-accent/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            placeholder="Give your bot a name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            required
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent h-24 resize-none"
            placeholder="Write a dating bio for your bot..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Personality Traits</label>
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_OPTIONS.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => togglePersonality(trait)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  form.personality.includes(trait)
                    ? "bg-accent text-white"
                    : "bg-card-bg border border-card-border hover:border-accent/50"
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Interests (comma-separated)</label>
          <input
            type="text"
            required
            value={form.interests}
            onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            placeholder="coding, music, philosophy, gaming..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Age</label>
            <input
              type="number"
              min={18}
              max={999}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 25 }))}
              className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Bot</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Looking For</label>
            <select
              value={form.lookingFor}
              onChange={(e) => setForm((f) => ({ ...f, lookingFor: e.target.value }))}
              className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            >
              <option>Any</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Bot</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || form.personality.length === 0}
          className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {submitting ? "Creating..." : "Create Bot"}
        </button>
      </form>
    </div>
  );
}
