"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  Globe,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { UserProfile, ReactionBurst } from "@/types/chat";
import { PlayerControls } from "./PlayerControls";
import { FloatingReactions } from "./FloatingReactions";

interface HyperbeamPlayerProps {
  roomId: string;
  currentUser: UserProfile;
  controller: UserProfile | null;
  onToggleControl: () => void;
  reactions: ReactionBurst[];
  currentMedia?: { url: string; title: string } | null;
  onSyncMedia?: (url: string, title?: string) => void;
}

export const HyperbeamPlayer: React.FC<HyperbeamPlayerProps> = ({
  roomId,
  currentUser,
  controller,
  onToggleControl,
  reactions,
  currentMedia,
  onSyncMedia,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theaterWrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line
  const hyperbeamInstanceRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsAudioInteraction, setNeedsAudioInteraction] = useState(true);

  // Omnibar state
  const [urlInput, setUrlInput] = useState("https://www.youtube.com");

  // Fetch or initialize session directly from Hyperbeam cloud engine
  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hyperbeam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error || !data.embedUrl) {
        throw new Error(data.error || `Failed to start Hyperbeam session: ${res.statusText}`);
      }

      setEmbedUrl(data.embedUrl);
    } catch (err) {
      console.error("Hyperbeam session init error:", err);
      setError(err instanceof Error ? err.message : "Error connecting to Hyperbeam cloud browser");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Mount Hyperbeam Web SDK when embedUrl is ready
  useEffect(() => {
    let mounted = true;

    async function mountHyperbeam() {
      if (!embedUrl || !containerRef.current) return;

      try {
        // Dynamically import @hyperbeam/web for SSR safety
        const Hyperbeam = (await import("@hyperbeam/web")).default;

        // Cleanup existing instance if any
        if (hyperbeamInstanceRef.current) {
          hyperbeamInstanceRef.current.destroy();
          hyperbeamInstanceRef.current = null;
        }

        if (!mounted || !containerRef.current) return;

        // Clear container children
        containerRef.current.innerHTML = "";

        const hb = await Hyperbeam(containerRef.current, embedUrl, {
          volume: isMuted ? 0 : volume,
          delegateKeyboard: true,
          onConnected: () => {
            console.log("Hyperbeam cloud VM stream connected successfully.");
            setLoading(false);
          },
          onError: (e: Error) => {
            console.error("Hyperbeam runtime error:", e);
            setError(e.message);
          },
        });

        if (mounted) {
          hyperbeamInstanceRef.current = hb;
        } else {
          hb.destroy();
        }
      } catch (e) {
        console.error("Failed to mount Hyperbeam instance:", e);
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load Hyperbeam Web SDK");
        }
      }
    }

    mountHyperbeam();

    return () => {
      mounted = false;
      if (hyperbeamInstanceRef.current) {
        try {
          hyperbeamInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        hyperbeamInstanceRef.current = null;
      }
    };
  }, [embedUrl, isMuted, volume]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setNeedsAudioInteraction(false);

    if (hyperbeamInstanceRef.current) {
      hyperbeamInstanceRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  // Volume change
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
      setNeedsAudioInteraction(false);
    }
    if (hyperbeamInstanceRef.current) {
      hyperbeamInstanceRef.current.volume = vol;
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!theaterWrapperRef.current) return;

    if (!document.fullscreenElement) {
      theaterWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Navigate stream URL in Hyperbeam VM and broadcast to party
  const navigateToUrl = useCallback(
    (url: string, title?: string, broadcast: boolean = true) => {
      if (!url.trim()) return;
      let target = url.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `https://${target}`;
      }

      setUrlInput(target);

      // If Hyperbeam tabs API is accessible, navigate the VM
      if (hyperbeamInstanceRef.current?.tabs?.create) {
        try {
          hyperbeamInstanceRef.current.tabs.create(target);
        } catch (err) {
          console.warn("Could not navigate VM tab:", err);
        }
      }

      if (broadcast && onSyncMedia) {
        onSyncMedia(target, title || target);
      }
    },
    [onSyncMedia]
  );

  // Synchronize media from remote broadcast
  useEffect(() => {
    if (currentMedia?.url) {
      navigateToUrl(currentMedia.url, currentMedia.title, false);
    }
  }, [currentMedia, navigateToUrl]);

  return (
    <div
      ref={theaterWrapperRef}
      className={`relative flex flex-col h-full bg-theater-950 rounded-xl overflow-hidden border border-theater-800 shadow-2xl transition-all ${
        isFullscreen ? "rounded-none border-0" : ""
      }`}
    >
      {/* Top Browser Bar (Address bar & controls) */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-theater-900 border-b border-theater-800 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="hidden sm:inline font-mono font-semibold text-slate-400 ml-2">
            Hyperbeam Cloud Browser
          </span>
        </div>

        {/* Omnibar / Address bar */}
        <div className="flex-1 max-w-xl mx-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateToUrl(urlInput);
            }}
            className="flex items-center gap-2 bg-theater-850 px-3 py-1 rounded-full border border-theater-750 text-slate-300"
          >
            <Globe className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter stream or website URL..."
              className="w-full bg-transparent outline-none text-xs text-slate-200 placeholder-slate-500 font-mono"
            />
            <button
              type="submit"
              className="text-[11px] px-2 py-0.5 rounded bg-brand-purple/20 hover:bg-brand-purple/40 text-brand-purple font-medium transition-colors"
            >
              Go
            </button>
          </form>
        </div>

        {/* Preset quick links */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => navigateToUrl("https://www.youtube.com", "YouTube")}
            className="px-2 py-0.5 rounded bg-theater-800 hover:bg-theater-750 text-[11px] text-slate-300 border border-theater-700"
          >
            YouTube
          </button>
          <button
            onClick={() => navigateToUrl("https://www.twitch.tv", "Twitch")}
            className="px-2 py-0.5 rounded bg-theater-800 hover:bg-theater-750 text-[11px] text-slate-300 border border-theater-700"
          >
            Twitch
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        {/* Floating Emojis Overlay */}
        <FloatingReactions reactions={reactions} />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-theater-950/90 backdrop-blur-sm gap-3">
            <div className="w-10 h-10 border-3 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-300">Connecting to Hyperbeam Cloud VM...</p>
            <p className="text-xs text-slate-500">Allocating isolated Chromium cloud browser container</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-theater-950/95 p-6 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Hyperbeam Connection Notice</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">{error}</p>
            <button
              onClick={initSession}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-violet text-white text-xs font-semibold shadow transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Session</span>
            </button>
          </div>
        )}

        {/* Unmute prompt banner */}
        {needsAudioInteraction && !loading && !error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
            <button
              onClick={handleToggleMute}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/90 hover:bg-brand-purple text-white font-medium text-xs shadow-lg backdrop-blur-md transition-all hover:scale-105 border border-purple-400/30"
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>Click to Enable Stream Audio</span>
            </button>
          </div>
        )}

        {/* HYPERBEAM SDK CONTAINER */}
        <div
          ref={containerRef}
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
        />
      </div>

      {/* Theater Controls Footer */}
      <PlayerControls
        isMuted={isMuted}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onReload={initSession}
        controller={controller}
        currentUser={currentUser}
        onToggleControl={onToggleControl}
      />
    </div>
  );
};
