"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/chat";
import { AVATAR_COLORS, DEFAULT_AVATARS, getRandomItem } from "@/lib/utils";

const STORAGE_KEY = "stream_watchparty_user";

const ADJECTIVES = ["Cosmic", "Neon", "Cyber", "Vivid", "Velvet", "Turbo", "Chill", "Silent", "Mega", "Shadow"];
const NOUNS = ["Viewer", "Streamer", "Pilot", "Captain", "Watcher", "Nomad", "Gamer", "CinemaBuff", "Astronaut"];

function generateDefaultProfile(): UserProfile {
  const randomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `user_${Date.now()}`;
  const randomName = `${getRandomItem(ADJECTIVES)} ${getRandomItem(NOUNS)}`;
  const randomAvatar = getRandomItem(DEFAULT_AVATARS);
  const randomColor = getRandomItem(AVATAR_COLORS);

  return {
    id: randomId,
    name: randomName,
    avatar: randomAvatar,
    color: randomColor,
  };
}

export function useRoomUser() {
  const [user, setUser] = useState<UserProfile>(generateDefaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        const fresh = generateDefaultProfile();
        setUser(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    } catch {
      // localStorage disabled or SSR fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { user, updateProfile, isLoaded };
}
