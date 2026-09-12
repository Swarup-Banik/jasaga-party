"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  VolumeX,
  Volume2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Globe,
  KeyRound,
  ShieldCheck,
  Film,
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
  const [isDemo, setIsDemo] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsAudioInteraction, setNeedsAudioInteraction] = useState(true);

  // Demo simulator state
  const [demoUrl, setDemoUrl] = useState("https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1");
  const [urlInput, setUrlInput] = useState("https://www.youtube.com/watch?v=jfKfPfyJRdk");

  // Fetch or initialize session
  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hyperbeam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize session: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.isDemo || !data.embedUrl) {
        setIsDemo(true);
        setLoading(false);
        return;
      }

      setIsDemo(false);
      setEmbedUrl(data.embedUrl);
    } catch (err) {
      console.warn("Session init fallback to demo:", err);
      setIsDemo(true);
      setError(err instanceof Error ? err.message : "Error connecting to Hyperbeam");
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
      if (!embedUrl || !containerRef.current || isDemo) return;

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
            console.log("Hyperbeam VM stream connected successfully.");
          },
          onError: (e: Error) => {
            console.error("Hyperbeam runtime error:", e);
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
          setIsDemo(true);
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
  }, [embedUrl, isDemo, isMuted, volume]);

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

  // Synchronize media from remote broadcast
  useEffect(() => {
    if (currentMedia?.url) {
      setUrlInput(currentMedia.url);
      if (currentMedia.url.includes("youtube.com/watch?v=")) {
        const vidId = currentMedia.url.split("v=")[1]?.split("&")[0];
        setDemoUrl(`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=0`);
      } else if (currentMedia.url.includes("youtu.be/")) {
        const vidId = currentMedia.url.split("youtu.be/")[1]?.split("?")[0];
        setDemoUrl(`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=0`);
      } else {
        setDemoUrl(currentMedia.url);
      }
    }
  }, [currentMedia]);

  // Preset demo websites & broadcast to room
  const loadDemoUrl = (url: string, title?: string, broadcast: boolean = true) => {
    setUrlInput(url);
    if (url.includes("youtube.com/watch?v=")) {
      const vidId = url.split("v=")[1]?.split("&")[0];
      setDemoUrl(`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=0`);
    } else if (url.includes("youtu.be/")) {
      const vidId = url.split("youtu.be/")[1]?.split("?")[0];
      setDemoUrl(`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=0`);
    } else {
      setDemoUrl(url);
    }

    if (broadcast && onSyncMedia) {
      onSyncMedia(url, title || url);
    }
  };

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
            Hyperbeam Virtual Browser
          </span>
        </div>

        {/* Omnibar / Address bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="flex items-center gap-2 bg-theater-850 px-3 py-1 rounded-full border border-theater-750 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <input
              type="text"
              value={isDemo ? urlInput : "https://hyperbeam.cloud/vm/active"}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadDemoUrl(urlInput);
              }}
              readOnly={!isDemo}
              placeholder="Enter stream or website URL..."
              className="w-full bg-transparent outline-none text-xs text-slate-200 placeholder-slate-500 font-mono"
            />
            {isDemo && (
              <button
                onClick={() => loadDemoUrl(urlInput)}
                className="text-[11px] px-2 py-0.5 rounded bg-brand-purple/20 hover:bg-brand-purple/40 text-brand-purple font-medium"
              >
                Go
              </button>
            )}
          </div>
        </div>

        {/* Presets in demo mode */}
        {isDemo && (
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => loadDemoUrl("https://www.youtube.com/watch?v=jfKfPfyJRdk", "Lofi Girl Beats")}
              className="px-2 py-0.5 rounded bg-theater-800 hover:bg-theater-750 text-[11px] text-slate-300 border border-theater-700"
            >
              Lofi Beats
            </button>
            <button
              onClick={() => loadDemoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Never Gonna Give You Up")}
              className="px-2 py-0.5 rounded bg-theater-800 hover:bg-theater-750 text-[11px] text-slate-300 border border-theater-700"
            >
              Rickroll
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        {/* Floating Emojis Overlay */}
        <FloatingReactions reactions={reactions} />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-theater-950/90 backdrop-blur-sm gap-3">
            <div className="w-10 h-10 border-3 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-300">Spinning up cloud virtual browser...</p>
            <p className="text-xs text-slate-500">Allocating isolated VM container session</p>
          </div>
        )}

        {/* Unmute prompt banner (Modern browser autoplay policy) */}
        {needsAudioInteraction && !loading && (
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

        {/* HYPERBEAM SDK CONTAINER (When live key is present) */}
        {!isDemo && embedUrl && (
          <div
            ref={containerRef}
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
          />
        )}

        {/* INTERACTIVE DEMO & API KEY ONBOARDING (When key is pending) */}
        {isDemo && !loading && (
          <div className="relative w-full h-full flex flex-col">
            {/* Realtime synchronized interactive demo iframe */}
            <div className="flex-1 w-full h-full relative">
              <iframe
                src={demoUrl}
                title="Virtual Browser Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />

              {/* Demo Mode Notice Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className="group relative">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theater-950/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs shadow-xl cursor-pointer">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span className="font-semibold">Demo Sandbox Active</span>
                  </div>

                  {/* Popover tooltip explaining how to plug in the key */}
                  <div className="hidden group-hover:block absolute right-0 mt-2 w-80 p-4 rounded-xl bg-theater-900 border border-theater-700 shadow-2xl text-xs text-slate-300 z-50">
                    <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Ready to add your Hyperbeam Key?</span>
                    </div>
                    <p className="text-slate-400 mb-2">
                      Get a free API key at{" "}
                      <a
                        href="https://hyperbeam.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-cyan underline"
                      >
                        hyperbeam.com
                      </a>
                      .
                    </p>
                    <div className="bg-theater-950 p-2 rounded-lg font-mono text-[11px] text-brand-purple border border-theater-800 select-all mb-2">
                      HYPERBEAM_API_KEY=your_key_here
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Add to <span className="text-slate-300">.env.local</span> and reload to activate dedicated Chromium cloud VMs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
        isDemoMode={isDemo}
      />
    </div>
  );
};
