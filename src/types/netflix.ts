/**
 * JASAGA PARTY — Netflix Synchronization Types & Protocol
 * 
 * Defines the strict, minimal playback event protocol for synchronizing
 * personal Netflix sessions across room participants.
 * 
 * Adheres to zero-credential, DRM-isolated privacy standards.
 */

import { UserProfile } from "./chat";

export type NetflixSyncRole = "host" | "guest";

export type NetflixEventType =
  | "PLAY"
  | "PAUSE"
  | "SEEK"
  | "EPISODE_CHANGE"
  | "INITIAL_SYNC"
  | "RESYNC"
  | "HEARTBEAT";

/**
 * Minimal authoritative playback event broadcasted over Supabase Realtime
 */
export interface NetflixPlaybackEvent {
  eventId: string;             // UUIDv4 unique event identifier
  roomId: string;              // JASAGA party room ID
  senderId: string;            // User ID of the sender
  senderRole: NetflixSyncRole; // Role of sender ("host" or "guest")
  role?: NetflixSyncRole;      // Alias for role
  eventType: NetflixEventType; // Playback event type
  type?: NetflixEventType;     // Alias for type
  mediaId?: string;            // Netflix title/episode watch ID (e.g., "81234567")
  position?: number;           // Playback position in seconds (float, e.g. 124.52)
  timestamp: number;           // Server/UTC epoch time in milliseconds
  sequence: number;            // Monotonically increasing sequence number (host only)
  playbackRate?: number;       // Optional playback rate (default 1.0)
  pairingToken?: string;       // Short-lived room pairing verification token
}

/**
 * Guest-initiated request to ask the host for an authoritative state refresh
 */
export interface NetflixResyncRequest {
  requestId: string;
  roomId: string;
  guestId: string;
  guestPosition: number;
  timestamp: number;
}

/**
 * Short-lived room pairing session token exchanged with the extension
 */
export interface NetflixPairingSession {
  roomId: string;
  role: NetflixSyncRole;
  userId: string;
  pairingToken: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Event validation result codes
 */
export type NetflixValidationStatus =
  | "VALID"
  | "REJECTED_ROOM_MISMATCH"
  | "REJECTED_UNAUTHORIZED_GUEST_COMMAND"
  | "REJECTED_DUPLICATE_EVENT"
  | "REJECTED_STALE_SEQUENCE"
  | "REJECTED_TIMESTAMP_OUT_OF_BOUNDS"
  | "REJECTED_INVALID_PAYLOAD"
  | "REJECTED_RATE_LIMIT_EXCEEDED"
  | "REJECTED_MALFORMED_EVENT"
  | "REJECTED_HOST_OFFLINE";

export interface NetflixValidationResult {
  valid: boolean;
  status: NetflixValidationStatus;
  reason?: string;
}

/**
 * Authoritative room playback state
 */
export interface NetflixRoomState {
  roomId: string;
  hostId: string;
  hostName: string;
  isPlaying: boolean;
  position: number;
  mediaId: string;
  lastUpdated: number;
  sequence: number;
  isHostOnline?: boolean;
}

/**
 * Extension connection and detection status reported by jasaga-bridge.js
 */
export interface NetflixExtensionStatus {
  installed: boolean;
  version?: string;
  paired: boolean;
  pairedRoomId?: string | null;
  pairedRole?: NetflixSyncRole | null;
  netflixTab: {
    found: boolean;
    tabId?: number;
    url?: string;
    isWatch: boolean;
    playerState?: {
      currentTimeSec?: number;
      durationSec?: number;
      isPlaying?: boolean;
      episodeId?: string;
      title?: string;
      activeSource?: string;
    } | null;
  };
}

/**
 * Drift analysis metrics computed locally on guest clients
 */
export interface NetflixDriftMetrics {
  localGuestPosition: number;
  estimatedHostPosition: number;
  driftSeconds: number;        // Absolute drift in seconds
  signedDriftSeconds: number;  // Positive: guest is ahead; Negative: guest is lagging behind
  latencyMs: number;           // Estimated one-way network latency offset
  inSync: boolean;             // True if drift < 1.0s (smooth uninterrupted playback)
  needsMinorNudge: boolean;    // True if 1.0s <= drift < 2.5s
  needsSeekCorrection: boolean;// True if drift >= 2.5s (requires cooldown seek correction)
}

/**
 * Discrete user action notifications emitted by page-observer
 */
export type NetflixTelemetryAction =
  | "USER_PLAY"
  | "USER_PAUSE"
  | "SEEK_COMMITTED"
  | "EPISODE_NAVIGATED"
  | "HEARTBEAT"
  | "FAILSAFE_ALERT";

export interface NetflixTelemetryPayload {
  action: NetflixTelemetryAction;
  isProgrammatic?: boolean;    // True if triggered by automated extension command (prevents circular loops)
  currentTimeSec: number;
  isPlaying: boolean;
  episodeId?: string;
  durationSec?: number;
  title?: string;
  failsafeActive?: boolean;
  reason?: string;
  timestamp: number;
}

/**
 * Netflix Room participant with presence and role metadata
 */
export interface NetflixRoomParticipant {
  user: UserProfile;
  role: NetflixSyncRole;
  onlineAt: string;
  inSyncWithHost?: boolean;
  currentPosition?: number;
  isWatchingOnNetflix?: boolean;
}

