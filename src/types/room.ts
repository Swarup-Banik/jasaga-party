import { UserProfile } from "./chat";

export interface WatchPartyRoom {
  id: string;
  name: string;
  createdAt: number;
  hostId: string;
  startUrl: string;
  sessionId?: string;
  embedUrl?: string;
  currentController?: UserProfile | null;
}

export interface HyperbeamSessionResponse {
  sessionId: string;
  embedUrl: string;
  adminToken?: string;
  isDemo?: boolean;
  message?: string;
}
