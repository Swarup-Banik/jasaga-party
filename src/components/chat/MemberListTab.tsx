"use client";

import React from "react";
import { Users, Crown, MousePointer, Sparkles } from "lucide-react";
import { PresenceUser, UserProfile } from "@/types/chat";

interface MemberListTabProps {
  members: PresenceUser[];
  currentUser: UserProfile;
  controller: UserProfile | null;
}

export const MemberListTab: React.FC<MemberListTabProps> = ({
  members,
  currentUser,
  controller,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-brand-purple" />
          <span>Active Viewers</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-theater-800 text-[11px] font-mono text-slate-300">
          {members.length} online
        </span>
      </div>

      <div className="space-y-2">
        {members.map((m) => {
          const isMe = m.user.id === currentUser.id;
          const hasControl = controller?.id === m.user.id;

          return (
            <div
              key={m.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isMe
                  ? "bg-theater-850/80 border-brand-purple/30 shadow-sm"
                  : "bg-theater-900/50 border-theater-800"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${m.user.color} flex items-center justify-center text-sm shadow-md`}
                  >
                    {m.user.avatar}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-theater-950" />
                </div>

                {/* Name */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {m.user.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-brand-purple font-mono font-medium">
                        (You)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Online
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {hasControl && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    title="User currently has interactive browser control"
                  >
                    <MousePointer className="w-2.5 h-2.5" />
                    <span>Control</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
