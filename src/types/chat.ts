export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: UserProfile;
  content: string;
  timestamp: number;
  type?: "message" | "system" | "action";
  reactions?: Record<string, number>; // emoji -> count
}

export interface ReactionBurst {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  xPercent?: number;
}

export interface PresenceUser {
  id: string;
  user: UserProfile;
  onlineAt: string;
  hasControl?: boolean;
}

export interface MediaSyncPayload {
  url: string;
  title: string;
  senderName: string;
  timestamp: number;
}
