"use client";

import React from "react";
import Image from "next/image";
import { X, Play, Star, Calendar, Film, Tv, Share2, Sparkles, ExternalLink } from "lucide-react";
import { MediaSearchResult } from "@/types/media";

interface MediaDetailModalProps {
  media: MediaSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForParty: (media: MediaSearchResult) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  isOpen,
  onClose,
  onSelectForParty,
}) => {
  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="relative bg-theater-900 border border-purple-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 anime-purple-glow">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-full bg-theater-950/80 hover:bg-theater-800 text-slate-300 hover:text-white border border-theater-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Container */}
        <div className="flex flex-col sm:flex-row">
          {/* Poster Column */}
          <div className="relative w-full sm:w-48 h-56 sm:h-auto shrink-0 bg-theater-950 flex items-center justify-center overflow-hidden">
            <Image
              src={media.posterUrl}
              alt={media.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-transparent to-theater-900" />
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-theater-950/90 border border-purple-500/40 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              {media.type}
            </div>
          </div>

          {/* Info Column */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Japanese title if available */}
              {media.japaneseTitle && (
                <p className="text-[11px] font-mono text-purple-400 font-semibold mb-0.5">
                  {media.japaneseTitle}
                </p>
              )}

              {/* Main Title */}
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mb-2">
                {media.title}
              </h2>

              {/* Meta pills: Score, Year, Episodes */}
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                {media.score && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{media.score}</span>
                  </span>
                )}

                {media.year && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-theater-800 text-slate-300">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{media.year}</span>
                  </span>
                )}

                {media.episodes && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-900/30 border border-purple-500/30 text-purple-300 text-[11px]">
                    {media.episodes} Ep
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-3">
                {media.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full bg-theater-800 text-[10px] text-slate-400 border border-theater-750"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="max-h-32 overflow-y-auto custom-scrollbar pr-1 mb-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {media.synopsis}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-theater-800">
              <button
                onClick={() => {
                  onSelectForParty(media);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch in Watch Party</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
