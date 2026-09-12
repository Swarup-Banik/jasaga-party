"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  MoveHorizontal,
  Pin,
  MessageCircle,
  Flame,
} from "lucide-react";

const DENJI_QUOTES = [
  "Reze-san! Look at what's playing on stream! ✨",
  "I want to eat toast with jam and binge watch all night! 🍞",
  "Pochita is super happy with this watch party! 🐶",
  "Who has the browser controls? Pass it over! 🪚",
  "This anime vibe is top tier! Let's goooo!",
  "Chainsaw revs: VRRRRRMMM! ⚡",
];

const REZE_QUOTES = [
  "Denji-kun, let's watch together and never leave~ 🌸",
  "Tick... tick... BOOM! Just kidding, it's just popcorn! 🍿💣",
  "Do you like country mouse or city mouse, Denji-kun? 🐭",
  "Hehe, this party has such cute purple lights 💜",
  "Shall I teach you Russian while we stream? ☕",
  "Let's run away together after this episode~ ✨",
];

export const ChainsawManCompanions: React.FC = () => {
  const [denjiQuote, setDenjiQuote] = useState(DENJI_QUOTES[0]);
  const [rezeQuote, setRezeQuote] = useState(REZE_QUOTES[0]);
  const [activeSpeaker, setActiveSpeaker] = useState<"denji" | "reze">("reze");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRoaming, setIsRoaming] = useState(false); // false = neatly docked in corner

  // Roaming state
  const [denjiPos, setDenjiPos] = useState(15);
  const [rezePos, setRezePos] = useState(24);
  const [walkDirection, setWalkDirection] = useState<"right" | "left">("right");

  // Gentle roaming animation if enabled
  useEffect(() => {
    if (isMinimized || !isRoaming) return;

    const interval = setInterval(() => {
      setDenjiPos((prev) => {
        let next = walkDirection === "right" ? prev + 0.8 : prev - 0.8;
        if (next > 60) {
          setWalkDirection("left");
          next = 60;
        } else if (next < 8) {
          setWalkDirection("right");
          next = 8;
        }
        return next;
      });

      setRezePos((prev) => {
        const offset = walkDirection === "right" ? 9 : -9;
        return Math.max(5, Math.min(75, denjiPos + offset));
      });
    }, 180);

    return () => clearInterval(interval);
  }, [denjiPos, walkDirection, isMinimized, isRoaming]);

  // Periodic cute quotes alternation
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setActiveSpeaker((prev) => (prev === "denji" ? "reze" : "denji"));
      if (Math.random() > 0.5) {
        setDenjiQuote(DENJI_QUOTES[Math.floor(Math.random() * DENJI_QUOTES.length)]);
      } else {
        setRezeQuote(REZE_QUOTES[Math.floor(Math.random() * REZE_QUOTES.length)]);
      }
    }, 7000);

    return () => clearInterval(quoteInterval);
  }, []);

  const handleDenjiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSpeaker("denji");
    setDenjiQuote(DENJI_QUOTES[Math.floor(Math.random() * DENJI_QUOTES.length)]);

    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { x: 0.85, y: 0.85 },
        colors: ["#f59e0b", "#f97316", "#ef4444", "#a855f7"],
      });
    } catch {
      // ignore
    }
  };

  const handleRezeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSpeaker("reze");
    setRezeQuote(REZE_QUOTES[Math.floor(Math.random() * REZE_QUOTES.length)]);

    try {
      confetti({
        particleCount: 30,
        spread: 65,
        origin: { x: 0.9, y: 0.85 },
        colors: ["#c084fc", "#ec4899", "#a855f7", "#38bdf8"],
      });
    } catch {
      // ignore
    }
  };

  return (
    <aside aria-label="Chainsaw Man Anime Companions" className="select-none pointer-events-none fixed bottom-4 right-4 z-40">
      {/* Minimized Toggle Button */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full bg-theater-900/95 hover:bg-theater-850 border border-purple-500/40 text-xs font-bold text-purple-300 shadow-[0_4px_20px_rgba(168,85,247,0.3)] backdrop-blur-md transition-all hover:scale-105 anime-purple-glow"
        >
          <span className="text-sm">🪚🌸</span>
          <span>Denji & Reze</span>
          <Eye className="w-3.5 h-3.5 text-purple-400" />
        </button>
      ) : isRoaming ? (
        /* ROAMING MODE: Walks along bottom */
        <div className="fixed bottom-3 left-0 right-0 pointer-events-none z-40 px-4">
          <div className="pointer-events-auto flex justify-end mb-1 mr-4 gap-1.5">
            <button
              onClick={() => setIsRoaming(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-theater-900/90 hover:bg-theater-800 border border-purple-500/40 text-[10px] font-semibold text-purple-300 shadow backdrop-blur-md"
              title="Dock in corner"
            >
              <Pin className="w-3 h-3" />
              <span>Dock</span>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-theater-900/90 hover:bg-theater-800 border border-theater-700 text-[10px] font-semibold text-slate-400 shadow backdrop-blur-md"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide</span>
            </button>
          </div>

          <div className="relative w-full h-28 pointer-events-none">
            {/* Speech bubble */}
            <div
              className="pointer-events-auto absolute -top-8 manga-bubble px-3 py-1.5 max-w-[240px] text-xs shadow-2xl z-30 transition-all duration-300"
              style={{ left: `${Math.max(5, Math.min(65, denjiPos))}%` }}
            >
              <p className="text-[10px] font-bold text-amber-400">
                {activeSpeaker === "denji" ? "🪚 Denji" : "🌸 Reze"}
              </p>
              <p className="text-slate-200 text-[11px] leading-tight">
                {activeSpeaker === "denji" ? denjiQuote : rezeQuote}
              </p>
            </div>

            {/* Denji */}
            <div
              onClick={handleDenjiClick}
              className="pointer-events-auto absolute bottom-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              style={{
                left: `${denjiPos}%`,
                transform: walkDirection === "left" ? "scaleX(-1)" : "none",
              }}
            >
              <div className="relative w-20 h-20 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-character-bob">
                <Image
                  src="/characters/denji.jpg"
                  alt="Denji"
                  fill
                  className="object-contain rounded-xl mix-blend-screen"
                />
              </div>
            </div>

            {/* Reze */}
            <div
              onClick={handleRezeClick}
              className="pointer-events-auto absolute bottom-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              style={{
                left: `${rezePos}%`,
                transform: walkDirection === "left" ? "scaleX(-1)" : "none",
              }}
            >
              <div className="relative w-20 h-20 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-character-bob">
                <Image
                  src="/characters/reze.jpg"
                  alt="Reze"
                  fill
                  className="object-contain rounded-xl mix-blend-screen"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DOCKED MODE (Clean, neatly arranged in corner) */
        <div className="pointer-events-auto flex flex-col items-end animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Manga Dialogue Bubble above dock */}
          <div className="manga-bubble px-3 py-2 max-w-[250px] mb-2 shadow-2xl z-30 transition-all duration-300 text-xs">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className={`text-[10px] font-bold ${
                  activeSpeaker === "denji" ? "text-amber-400" : "text-purple-300"
                }`}
              >
                {activeSpeaker === "denji" ? "🪚 デンジ (Denji)" : "🌸 レゼ (Reze)"}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">click to react</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-snug">
              {activeSpeaker === "denji" ? denjiQuote : rezeQuote}
            </p>
          </div>

          {/* Dock Station Card */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-theater-900/95 border border-purple-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md anime-purple-glow">
            {/* Denji Avatar */}
            <div
              onClick={handleDenjiClick}
              className="relative w-14 h-14 cursor-pointer hover:scale-110 active:scale-95 transition-all group flex flex-col items-center"
              title="Click Denji for chainsaw sparks! 🪚"
            >
              <Image
                src="/characters/denji.jpg"
                alt="Denji & Pochita"
                fill
                className="object-contain rounded-xl mix-blend-screen"
                priority
              />
              <span className="absolute -bottom-1 text-[8px] font-bold px-1 rounded bg-black/80 border border-amber-500/40 text-amber-300">
                デンジ
              </span>
            </div>

            {/* Reze Avatar */}
            <div
              onClick={handleRezeClick}
              className="relative w-14 h-14 cursor-pointer hover:scale-110 active:scale-95 transition-all group flex flex-col items-center"
              title="Click Reze for bomb rose flower particles! 🌸💣"
            >
              <Image
                src="/characters/reze.jpg"
                alt="Reze"
                fill
                className="object-contain rounded-xl mix-blend-screen"
                priority
              />
              <span className="absolute -bottom-1 text-[8px] font-bold px-1 rounded bg-black/80 border border-purple-500/40 text-purple-300">
                レゼ
              </span>
            </div>

            {/* Dock Controls */}
            <div className="flex flex-col gap-1 pl-1 border-l border-theater-800">
              <button
                onClick={() => setIsRoaming(true)}
                className="p-1.5 rounded-lg hover:bg-theater-800 text-purple-400 hover:text-purple-300 transition-colors"
                title="Let them roam across the bottom"
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg hover:bg-theater-800 text-slate-400 hover:text-white transition-colors"
                title="Minimize companions"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
