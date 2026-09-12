"use client";

import React, { useState } from "react";
import { MessageSquare, Users, Radio, X, Sparkles, Database, Search } from "lucide-react";
import { ChatMessage, UserProfile, PresenceUser } from "@/types/chat";
import { MediaSearchResult } from "@/types/media";
import { MediaSearchSection } from "@/components/media/MediaSearchSection";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { EmojiPickerBar } from "./EmojiPickerBar";
import { MemberListTab } from "./MemberListTab";

interface ChatSidebarProps {
  messages: ChatMessage[];
  onlineMembers: PresenceUser[];
  currentUser: UserProfile;
  controller: UserProfile | null;
  onSendMessage: (text: string) => void;
  onBurstReaction: (emoji: string) => void;
  onSyncMedia?: (url: string, title?: string) => void;
  isUsingSupabase: boolean;
  connectionStatus: "connecting" | "connected" | "fallback";
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  onlineMembers,
  currentUser,
  controller,
  onSendMessage,
  onBurstReaction,
  onSyncMedia,
  isUsingSupabase,
  connectionStatus,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "members" | "search">("chat");
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container: 25% on desktop, slide-over drawer on mobile */}
      <aside
        className={`fixed lg:static top-0 right-0 bottom-0 z-50 w-[85vw] sm:w-[360px] lg:w-full h-full bg-theater-950/95 lg:bg-theater-950 border-l border-theater-800 flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header & Tab Navigation */}
        <div className="p-3 bg-theater-900 border-b border-theater-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-theater-950 rounded-xl border border-theater-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-theater-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-purple" />
              <span>Party Chat</span>
              {messages.length > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {messages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "members"
                  ? "bg-theater-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Viewers</span>
              <span className="px-1.5 py-0.2 rounded-full bg-brand-cyan/10 text-brand-cyan text-[10px] font-mono">
                {onlineMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("search")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "search"
                  ? "bg-theater-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Search Internet for Anime, Movies & Shows"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>Search</span>
            </button>
          </div>

          {/* Close mobile button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-theater-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Status Pill */}
        <div className="px-3 py-1.5 bg-theater-950/80 border-b border-theater-850 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio
              className={`w-3 h-3 ${
                isUsingSupabase
                  ? "text-emerald-400 animate-pulse"
                  : "text-amber-400"
              }`}
            />
            <span className="truncate">
              {isUsingSupabase
                ? "Supabase Realtime"
                : "Multi-Tab Fallback Sync"}
            </span>
          </div>

          {!isUsingSupabase && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-brand-purple hover:underline text-[10px] font-semibold"
            >
              Connect DB
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages Feed */}
            <ChatMessageList messages={messages} currentUser={currentUser} />

            {/* Quick Burst Reactions Bar */}
            <EmojiPickerBar
              onSelectEmoji={(emoji) => onSendMessage(emoji)}
              onBurstReaction={onBurstReaction}
            />

            {/* Input Component */}
            <ChatInput onSendMessage={onSendMessage} />
          </div>
        ) : activeTab === "members" ? (
          <MemberListTab
            members={onlineMembers}
            currentUser={currentUser}
            controller={controller}
          />
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="px-2 py-1 mb-2 bg-purple-950/40 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Search Google & MAL to stream in party</span>
            </div>
            <MediaSearchSection
              compact
              onSelectMedia={(item) => {
                const streamTarget = item.trailerUrl || item.watchUrl || "https://www.youtube.com";
                if (onSyncMedia) {
                  onSyncMedia(streamTarget, item.title);
                } else {
                  onSendMessage(
                    `🎬 [Now Playing] ${item.title} (${item.year || "Release"}) • ${item.synopsis.slice(0, 100)}...`
                  );
                }
                setActiveTab("chat");
              }}
            />
          </div>
        )}
      </aside>

      {/* Supabase Onboarding Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-theater-900 border border-theater-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-200 text-sm">
                  Supabase Realtime Setup
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Your watch party is currently syncing across local browser tabs using{" "}
              <code className="text-brand-cyan">BroadcastChannel</code>. To enable global real-time chat with friends anywhere:
            </p>

            <ol className="text-xs text-slate-400 space-y-2 mb-4 list-decimal pl-4">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-purple underline"
                >
                  supabase.com
                </a>
              </li>
              <li>Navigate to <strong>Project Settings</strong> → <strong>API</strong></li>
              <li>
                Paste into your <code className="text-slate-200">.env.local</code>:
              </li>
            </ol>

            <div className="bg-theater-950 p-3 rounded-xl border border-theater-800 font-mono text-[11px] text-brand-purple mb-4 select-all leading-normal">
              NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2 bg-brand-purple hover:bg-brand-violet text-white text-xs font-semibold rounded-xl transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
