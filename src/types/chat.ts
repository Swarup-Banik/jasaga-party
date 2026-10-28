export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost?: boolean;
}

export interface MessageReplyReference {
  id: string;
  senderName: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: UserProfile;
  content: string;
  timestamp: number;
  type?: "message" | "system" | "action";
  // reactions can be map of emoji -> count or emoji -> array of userIds
  reactions?: Record<string, string[] | number>;
  replyTo?: MessageReplyReference;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
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
