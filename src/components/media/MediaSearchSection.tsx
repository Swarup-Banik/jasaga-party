"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Star,
  Play,
  Info,
  Sparkles,
  Globe,
  ExternalLink,
  BookOpen,
  X,
  Share2,
} from "lucide-react";
import { MediaSearchResult, InternetSummary } from "@/types/media";
import { MediaDetailModal } from "./MediaDetailModal";
import { generateRoomId } from "@/lib/utils";

const QUICK_TAGS = [
  "Chainsaw Man",
  "Jujutsu Kaisen",
  "Cyberpunk Edgerunners",
  "Stranger Things",
  "Arcane",
  "Demon Slayer",
  "Interstellar",
];

interface MediaSearchSectionProps {
  onSelectMedia?: (media: MediaSearchResult) => void;
  compact?: boolean;
}

export const MediaSearchSection: React.FC<MediaSearchSectionProps> = ({
  onSelectMedia,
  compact = false,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "anime" | "show">("all");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [internetSummary, setInternetSummary] = useState<InternetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaSearchResult | null>(null);

  const fetchResults = useCallback(async (q: string, type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setInternetSummary(data.summary || null);
      }
    } catch (err) {
      console.warn("Search fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch for featured/trending media
  useEffect(() => {
    fetchResults("", filterType);
  }, [fetchResults, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchResults(query, filterType);
  };

  const handleQuickTag = (tag: string) => {
    setQuery(tag);
    fetchResults(tag, filterType);
  };

  const handleClear = () => {
    setQuery("");
    fetchResults("", filterType);
  };

  const handleWatchPartyLaunch = (media: MediaSearchResult) => {
    if (onSelectMedia) {
      onSelectMedia(media);
      return;
    }

    const roomId = generateRoomId();
    const streamTarget = media.trailerUrl || media.watchUrl || "https://www.youtube.com";
    router.push(
      `/room/${roomId}?title=${encodeURIComponent(media.title)}&url=${encodeURIComponent(
        streamTarget
      )}`
    );
  };

  return (
    <div className={`w-full ${compact ? "p-3" : "py-4"}`}>
      {/* Header (hidden in compact mode) */}
      {!compact && (
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Internet Media Search & AI Summary</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Search Any Anime, Movie or Show
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Get instant summaries from Google, Wikipedia & MyAnimeList, and launch a synced watch party in 1-click.
          </p>
        </div>
      )}

      {/* Search Input Bar */}
      <div className={`max-w-3xl mx-auto ${compact ? "mb-3" : "mb-6"}`}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-purple-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, movies, or shows (e.g. Chainsaw Man, Stranger Things, Inception...)"
            className="w-full bg-theater-900/90 border border-purple-500/30 focus:border-purple-400 rounded-2xl py-3 pl-11 pr-24 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-lg focus:shadow-[0_0_25px_rgba(168,85,247,0.3)]"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-16 p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white text-xs font-bold transition-all shadow"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Filter Pills & Quick Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-theater-900/80 border border-theater-800">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === "all"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("anime")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === "anime"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Anime 🌸
            </button>
            <button
              type="button"
              onClick={() => setFilterType("show")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === "show"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Movies & TV 🎬
            </button>
          </div>

          {/* Quick Tags */}
          {!compact && (
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-500 font-medium">Trending:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTag(tag)}
                  className="px-2.5 py-0.5 rounded-lg bg-theater-850 hover:bg-theater-800 border border-theater-750 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="text-xs font-mono">Fetching summary from internet databases...</span>
        </div>
      )}

      {/* 🌟 GOOGLE / WIKIPEDIA INTERNET SUMMARY DOSSIER BOX 🌟 */}
      {!loading && internetSummary && (
        <div className="max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="relative bg-theater-900/90 border border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md anime-purple-glow flex flex-col md:flex-row gap-5">
            {/* Poster / Thumbnail if available */}
            {internetSummary.thumbnail && (
              <div className="relative w-full md:w-36 h-44 shrink-0 rounded-xl overflow-hidden bg-theater-950 border border-theater-800 self-center md:self-start">
                <Image
                  src={internetSummary.thumbnail}
                  alt={internetSummary.headline}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 150px"
                />
              </div>
            )}

            {/* Info Summary Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400 tracking-wide uppercase">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>Internet Overview & Summary</span>
                  </div>
                  <a
                    href={internetSummary.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-purple-300 hover:underline transition-colors"
                  >
                    <span>{internetSummary.sourceName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Title and description */}
                <h3 className="text-lg sm:text-xl font-black text-white mb-0.5">
                  {internetSummary.headline}
                </h3>
                <p className="text-xs text-purple-300/80 font-medium mb-3">
                  {internetSummary.description}
                </p>

                {/* Executive Summary Extract */}
                <div className="bg-theater-950/60 p-3.5 rounded-xl border border-theater-800 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2 mb-3">
                  {internetSummary.extract}
                </div>

                {/* Key Facts Pills */}
                {internetSummary.keyFacts && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {internetSummary.keyFacts.map((fact) => (
                      <div
                        key={fact.label}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theater-850 border border-theater-750 text-xs"
                      >
                        <span className="text-slate-400">{fact.label}:</span>
                        <span className="font-semibold text-slate-200">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Launch Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-theater-800">
                <button
                  onClick={() => {
                    const topMatch = results[0];
                    if (topMatch) handleWatchPartyLaunch(topMatch);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Watch Party for this Show</span>
                </button>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    internetSummary.headline + " streaming where to watch"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-theater-850 hover:bg-theater-800 border border-theater-750 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3 h-3" />
                  <span>Where to Watch (Google)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section Title */}
      {!loading && results.length > 0 && (
        <div className="max-w-5xl mx-auto mb-3 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {query ? `Matching Results for "${query}"` : "Featured Popular Streams"}
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {results.length} available
          </span>
        </div>
      )}

      {/* Results Grid */}
      {!loading && (
        <div
          className={`max-w-5xl mx-auto grid gap-4 ${
            compact
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          }`}
        >
          {results.map((item) => (
            <div
              key={item.id}
              className="group relative bg-theater-900/80 border border-purple-900/20 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(168,85,247,0.2)] flex flex-col justify-between"
            >
              {/* Poster Thumbnail */}
              <div className="relative w-full aspect-[2/3] bg-theater-950 overflow-hidden">
                <Image
                  src={item.posterUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-theater-950 via-transparent to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded-md bg-theater-950/90 backdrop-blur-sm border border-theater-800 text-[10px] font-bold text-purple-300 uppercase">
                    {item.type}
                  </span>
                  {item.score && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-theater-950 text-[10px] font-black shadow">
                      <Star className="w-2.5 h-2.5 fill-theater-950" />
                      <span>{item.score}</span>
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <button
                    onClick={() => handleWatchPartyLaunch(item)}
                    className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Watch in Party</span>
                  </button>

                  <button
                    onClick={() => setSelectedMedia(item)}
                    className="w-full py-1.5 px-2 rounded-xl bg-theater-850/90 hover:bg-theater-800 text-slate-200 text-xs font-medium border border-theater-700 flex items-center justify-center gap-1"
                  >
                    <Info className="w-3 h-3 text-purple-400" />
                    <span>Read Summary</span>
                  </button>
                </div>
              </div>

              {/* Title & Info Bar */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h5
                    className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-300 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h5>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    {item.year && <span>{item.year}</span>}
                    {item.episodes && (
                      <>
                        <span>•</span>
                        <span>{item.episodes} Ep</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {item.genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="px-1.5 py-0.2 rounded-md bg-theater-850 text-[9px] text-slate-400 border border-theater-800"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        onSelectForParty={handleWatchPartyLaunch}
      />
    </div>
  );
};
