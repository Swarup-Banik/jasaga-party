"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Clock, Smile, ThumbsUp, Sparkles, Tv, Flame, X } from "lucide-react";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "Smileys & Mood",
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊",
      "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨",
      "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
      "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸",
      "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳",
      "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖",
      "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬",
      "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽",
    ],
  },
  {
    id: "hype",
    name: "Party & Hype",
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
    emojis: [
      "🔥", "⚡", "💥", "✨", "🌟", "⭐", "🎉", "🎊", "🚀", "💯",
      "🏆", "🥇", "👑", "💎", "💣", "🪚", "🌸", "🐶", "🍿", "🥤",
      "🎯", "🎲", "🎮", "🕹️", "🎪", "🎭", "🎨", "🎤", "🎧", "🎬",
    ],
  },
  {
    id: "gestures",
    name: "Gestures & People",
    icon: <ThumbsUp className="w-3.5 h-3.5 text-brand-purple" />,
    emojis: [
      "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋",
      "🤚", "🖐️", "✋", "🖖", "🫡", "💪", "🦾", "🤌", "🤏", "✍️",
      "👀", "👁️", "🧠", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤",
      "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖",
    ],
  },
  {
    id: "anime",
    name: "Anime & Snacks",
    icon: <Tv className="w-3.5 h-3.5 text-brand-cyan" />,
    emojis: [
      "🍿", "🥤", "🍙", "🍘", "🍚", "🍜", "🍲", "🍢", "🍡", "🍧",
      "🍨", "🍦", "🍰", "🎂", "🧁", "🍫", "🍬", "🍭", "🍩", "🍪",
      "🐱", "🦊", "🐺", "🐼", "🐲", "🐉", "⚔️", "🗡️", "🛡️", "🔮",
      "⚡", "🩸", "🍙", "🧋", "🍵", "🍶", "🍺", "🍻", "🥂", "🍷",
    ],
  },
];

const RECENT_STORAGE_KEY = "jasaga_recent_emojis";

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 18));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Escape key & outside click listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus search on open
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);

    // Update recents
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 18);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      if (activeTab === "all") return EMOJI_CATEGORIES;
      return EMOJI_CATEGORIES.filter((c) => c.id === activeTab);
    }
    // Search filter
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter((emoji) => emoji.includes(q)),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-2 right-2 mb-2 z-40 bg-theater-900/98 backdrop-blur-md border border-theater-750/90 rounded-2xl shadow-2xl p-2.5 flex flex-col max-h-72 select-none anime-purple-glow animate-in fade-in slide-in-from-bottom-2 duration-150 motion-reduce:animate-none"
      role="dialog"
      aria-label="Emoji Picker"
    >
      {/* Header with Search and Close */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-theater-950/90 border border-theater-800 focus:border-brand-purple rounded-xl py-1 pl-8 pr-7 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-theater-800 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex items-center gap-1 mb-2 px-0.5 overflow-x-auto no-scrollbar shrink-0 border-b border-theater-800/80 pb-1.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
              activeTab === "all"
                ? "bg-brand-purple text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-theater-800/60"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>All</span>
          </button>
          {recentEmojis.length > 0 && (
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                activeTab === "recent"
                  ? "bg-brand-purple text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-theater-800/60"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Recent</span>
            </button>
          )}
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                activeTab === cat.id
                  ? "bg-brand-purple text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-theater-800/60"
              }`}
            >
              {cat.icon}
              <span className="truncate max-w-[60px]">{cat.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-0">
        {/* Recent Emojis */}
        {!search && (activeTab === "all" || activeTab === "recent") && recentEmojis.length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-purple" />
              <span>Frequently Used</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {recentEmojis.map((emoji, idx) => (
                <button
                  key={`rec-${idx}-${emoji}`}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="h-7 w-full flex items-center justify-center rounded-lg hover:bg-theater-800 text-base hover:scale-125 active:scale-95 transition-transform"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {activeTab !== "recent" &&
          filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                {category.icon}
                <span>{category.name}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {category.emojis.map((emoji, idx) => (
                  <button
                    key={`${category.id}-${idx}-${emoji}`}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="h-7 w-full flex items-center justify-center rounded-lg hover:bg-theater-800 text-base hover:scale-125 active:scale-95 transition-transform"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

        {filteredCategories.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">
            No emojis match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};
