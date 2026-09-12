import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomId(): string {
  const adjectives = [
    "cozy",
    "cyber",
    "neon",
    "retro",
    "midnight",
    "velvet",
    "stellar",
    "cosmic",
    "vivid",
    "lunar",
    "golden",
    "prime",
  ];
  const nouns = [
    "cinema",
    "lounge",
    "theater",
    "stream",
    "screen",
    "party",
    "arcade",
    "oasis",
    "hub",
    "vault",
    "galaxy",
    "stage",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}-${noun}-${num}`;
}

export const AVATAR_COLORS = [
  "from-purple-600 via-violet-600 to-indigo-700",
  "from-pink-500 via-purple-600 to-rose-600",
  "from-fuchsia-600 via-purple-700 to-indigo-800",
  "from-amber-400 via-orange-500 to-red-600",
  "from-cyan-400 via-blue-600 to-purple-600",
  "from-emerald-400 via-teal-600 to-purple-600",
  "from-violet-500 via-purple-600 to-pink-600",
  "from-red-500 via-purple-600 to-amber-500",
];

export const DEFAULT_AVATARS = ["🪚", "💣", "🐶", "🌸", "🍿", "🎬", "⚡", "😈", "🩸", "✨"];

export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
