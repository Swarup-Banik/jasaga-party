// src/types/voice.ts

export type VoiceStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "permission_denied"
  | "error";

export type VoiceSignalType =
  | "voice_join"
  | "offer"
  | "answer"
  | "candidates"
  | "voice_leave"
  | "voice_state";

export interface VoiceSignalPayload {
  type: VoiceSignalType;
  from: string; // sender user id
  to?: string; // target user id (omitted for room-wide announcements like voice_join/leave)
  roomId: string;
  sdp?: RTCSessionDescriptionInit;
  candidates?: RTCIceCandidateInit[];
  isMuted?: boolean;
  isSpeaking?: boolean;
  timestamp: number;
}

export interface VoiceParticipant {
  userId: string;
  userName: string;
  avatar: string;
  color: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: number;
}
