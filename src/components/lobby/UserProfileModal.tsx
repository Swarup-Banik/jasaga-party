"use client";

import React, { useState } from "react";
import { X, Check, User } from "lucide-react";
import { UserProfile } from "@/types/chat";
import { DEFAULT_AVATARS, AVATAR_COLORS } from "@/lib/utils";

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [selectedColor, setSelectedColor] = useState(user.color);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      avatar: selectedAvatar,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-theater-900 border border-theater-750 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-purple" />
            <h2 className="text-base font-bold text-slate-100">Party Identity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-theater-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center py-2">
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-tr ${selectedColor} flex items-center justify-center text-3xl shadow-xl ring-4 ring-theater-800 transition-all`}
            >
              {selectedAvatar}
            </div>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              Live Preview
            </span>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              required
              className="w-full px-3 py-2 bg-theater-850 border border-theater-700 focus:border-brand-purple rounded-xl text-xs text-slate-200 outline-none"
              placeholder="e.g. PopcornLover"
            />
          </div>

          {/* Avatar Emojis */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pick Avatar Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DEFAULT_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`h-9 flex items-center justify-center rounded-xl text-lg transition-all ${
                    selectedAvatar === emoji
                      ? "bg-brand-purple/30 border-2 border-brand-purple scale-110"
                      : "bg-theater-850 hover:bg-theater-800 border border-theater-750"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Colors */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Badge Aura Color
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {AVATAR_COLORS.map((colorGrad) => (
                <button
                  key={colorGrad}
                  type="button"
                  onClick={() => setSelectedColor(colorGrad)}
                  className={`w-7 h-7 rounded-full bg-gradient-to-tr ${colorGrad} shrink-0 transition-transform ${
                    selectedColor === colorGrad
                      ? "ring-2 ring-white scale-110"
                      : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-brand-violet to-brand-purple hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
};
