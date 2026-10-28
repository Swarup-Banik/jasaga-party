"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Reply, X, EyeOff } from "lucide-react";
import { MessageReplyReference } from "@/types/chat";
import { VoiceStatus, VoiceParticipant } from "@/types/voice";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { VoiceMicButton } from "@/components/voice/VoiceMicButton";

interface ChatInputProps {
  onSendMessage: (content: string, replyTo?: MessageReplyReference) => void;
  replyingTo?: MessageReplyReference | null;
  onCancelReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;

  // Voice Chat Integration Props
  voiceStatus?: VoiceStatus;
  isVoiceMuted?: boolean;
  isVoiceSpeaking?: boolean;
  voiceParticipants?: VoiceParticipant[];
  availableAudioDevices?: MediaDeviceInfo[];
  selectedAudioDeviceId?: string;
  voiceErrorMessage?: string | null;
  onJoinVoice?: () => void;
  onLeaveVoice?: () => void;
  onToggleVoiceMute?: () => void;
  onChangeAudioDevice?: (deviceId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping,
  disabled,
  voiceStatus = "disconnected",
  isVoiceMuted = false,
  isVoiceSpeaking = false,
  voiceParticipants = [],
  availableAudioDevices = [],
  selectedAudioDeviceId = "",
  voiceErrorMessage,
  onJoinVoice,
  onLeaveVoice,
  onToggleVoiceMute,
  onChangeAudioDevice,
}) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when user clicks reply
  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  // Handle typing indicator debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (onTyping) {
      if (val.trim()) {
        onTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          onTyping(false);
        }, 2500);
      } else {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        onTyping(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping?.(false);

    onSendMessage(text.trim(), replyingTo || undefined);
    setText("");
    onCancelReply?.();
    setShowEmojiPicker(false);
  };

  const handleAddEmoji = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleInsertSpoiler = () => {
    const input = inputRef.current;
    if (!input) {
      setText((prev) => `${prev}||spoiler||`);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selected = text.substring(start, end);

    if (selected) {
      const replacement = `||${selected}||`;
      const next = text.substring(0, start) + replacement + text.substring(end);
      setText(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, end + 2);
      }, 10);
    } else {
      const next = text.substring(0, start) + `||spoiler||` + text.substring(end);
      setText(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 9);
      }, 10);
    }
  };

  return (
    <div className="relative p-2.5 bg-theater-950 border-t border-theater-800 shrink-0">
      {/* Floating Categorized & Searchable Emoji Picker Popover */}
      <EmojiPickerPopover
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleAddEmoji}
      />

      {/* Compact Reply-To Banner */}
      {replyingTo && (
        <div className="mb-2 px-2.5 py-1 rounded-xl bg-theater-900 border border-brand-purple/40 flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-1.5 min-w-0">
            <Reply className="w-3 h-3 text-brand-purple shrink-0" />
            <span className="text-[11px] text-slate-400 shrink-0">
              Replying to <span className="font-semibold text-slate-200">{replyingTo.senderName}</span>:
            </span>
            <span className="text-[11px] text-slate-400 italic truncate max-w-[160px]">
              {replyingTo.content}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-theater-800 transition-colors ml-2"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form with Integrated Microphone & Send Controls */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <div className="relative flex-1 flex items-center min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Send a message... (use ||spoiler|| for spoilers)"}
            disabled={disabled}
            maxLength={500}
            className="w-full bg-theater-850 hover:bg-theater-800/80 focus:bg-theater-850 border border-theater-750 focus:border-brand-purple rounded-xl py-2 pl-3.5 pr-16 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
          />

          {/* Quick Actions inside input: Spoiler & Emoji */}
          <div className="absolute right-2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleInsertSpoiler}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-theater-800"
              title="Wrap spoiler ||text||"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-1 rounded transition-colors ${
                showEmojiPicker
                  ? "text-brand-purple bg-theater-800"
                  : "text-slate-400 hover:text-brand-purple hover:bg-theater-800"
              }`}
              title="Insert emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integrated Voice Microphone Action Button */}
        {onJoinVoice && (
          <VoiceMicButton
            status={voiceStatus}
            isMuted={isVoiceMuted}
            isSpeaking={isVoiceSpeaking}
            voiceParticipants={voiceParticipants}
            availableAudioDevices={availableAudioDevices}
            selectedDeviceId={selectedAudioDeviceId}
            errorMessage={voiceErrorMessage}
            onJoinVoice={onJoinVoice}
            onLeaveVoice={onLeaveVoice || (() => {})}
            onToggleMute={onToggleVoiceMute || (() => {})}
            onChangeInputDevice={onChangeAudioDevice || (() => {})}
            disabled={disabled}
          />
        )}

        {/* Send Message Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-violet to-brand-purple text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
          title="Send message (Enter)"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
