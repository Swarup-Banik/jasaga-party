"use client";

import React, { useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TheaterHeader } from "@/components/theater/TheaterHeader";
import { HyperbeamPlayer } from "@/components/theater/HyperbeamPlayer";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { UserProfileModal } from "@/components/lobby/UserProfileModal";
import { ChainsawManCompanions } from "@/components/anime/ChainsawManCompanions";
import { useRoomUser } from "@/hooks/useRoomUser";
import { useSupabaseChat } from "@/hooks/useSupabaseChat";

function RoomTheater() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = (params?.roomId as string) || "lounge";
  const roomTitle = searchParams?.get("title") || `Watch Party #${roomId}`;

  const { user, updateProfile, isLoaded } = useRoomUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    messages,
    onlineMembers,
    reactions,
    controller,
    currentMedia,
    isUsingSupabase,
    connectionStatus,
    sendMessage,
    sendReaction,
    toggleControl,
    syncMedia,
  } = useSupabaseChat({ roomId, user });

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleToggleMobileChat = () => {
    setIsMobileChatOpen((prev) => !prev);
    if (!isMobileChatOpen) {
      setUnreadCount(0);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-theater-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Initializing theater session...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-theater-950 overflow-hidden select-none">
      {/* Theater Top Navigation */}
      <TheaterHeader
        roomId={roomId}
        roomName={roomTitle}
        currentUser={user}
        onlineMembers={onlineMembers}
        onOpenProfile={() => setShowProfileModal(true)}
        onToggleMobileChat={handleToggleMobileChat}
        isMobileChatOpen={isMobileChatOpen}
        unreadCount={unreadCount}
      />

      {/* Main Screen: 75% Virtual Browser / 25% Chat Sidebar Split */}
      <main className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Virtual Browser Theater (75% on Desktop, 100% on Mobile) */}
        <section className="w-full lg:w-[75%] h-full p-2 lg:p-3 flex flex-col min-w-0 transition-all">
          <HyperbeamPlayer
            roomId={roomId}
            currentUser={user}
            controller={controller}
            onToggleControl={toggleControl}
            reactions={reactions}
            currentMedia={currentMedia}
            onSyncMedia={syncMedia}
          />
        </section>

        {/* Real-time Chat Sidebar (25% on Desktop, Slide-over on Mobile) */}
        <section className="hidden lg:flex lg:w-[25%] h-full flex-col min-w-[280px]">
          <ChatSidebar
            messages={messages}
            onlineMembers={onlineMembers}
            currentUser={user}
            controller={controller}
            onSendMessage={handleSendMessage}
            onBurstReaction={sendReaction}
            onSyncMedia={syncMedia}
            isUsingSupabase={isUsingSupabase}
            connectionStatus={connectionStatus}
            isMobileOpen={false}
            onCloseMobile={() => setIsMobileChatOpen(false)}
          />
        </section>

        {/* Mobile Slide-over Chat Drawer (< 1024px) */}
        <div className="lg:hidden">
          <ChatSidebar
            messages={messages}
            onlineMembers={onlineMembers}
            currentUser={user}
            controller={controller}
            onSendMessage={handleSendMessage}
            onBurstReaction={sendReaction}
            onSyncMedia={syncMedia}
            isUsingSupabase={isUsingSupabase}
            connectionStatus={connectionStatus}
            isMobileOpen={isMobileChatOpen}
            onCloseMobile={() => setIsMobileChatOpen(false)}
          />
        </div>
      </main>

      {/* Profile Customize Modal */}
      <UserProfileModal
        user={user}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={updateProfile}
      />

      {/* Moving Denji & Reze Anime Companions */}
      <ChainsawManCompanions />
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-theater-950 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading theater...</span>
        </div>
      }
    >
      <RoomTheater />
    </Suspense>
  );
}
