/**
 * JASAGA PARTY — Netflix Synchronization & Validation Engine
 * 
 * Pure, deterministic engine responsible for:
 * 1. Short-lived room pairing session generation and verification.
 * 2. Strict Host Authority enforcement and guest command rejection.
 * 3. Monotonic sequence numbering and stale-event protection.
 * 4. Duplicate-event detection using LRU seen-event caches.
 * 5. Deterministic drift modeling for synchronized playback.
 */

import {
  NetflixPlaybackEvent,
  NetflixSyncRole,
  NetflixEventType,
  NetflixValidationResult,
  NetflixRoomState,
  NetflixPairingSession,
  NetflixDriftMetrics,
} from "@/types/netflix";

const DEFAULT_PAIRING_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates a short-lived pairing session token for the extension
 */
export function generatePairingSession(
  roomId: string,
  role: NetflixSyncRole,
  userId: string,
  ttlMs: number = DEFAULT_PAIRING_TTL_MS
): NetflixPairingSession {
  const now = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const pairingToken = `pair_${roomId}_${userId.slice(0, 6)}_${now}_${randomSuffix}`;

  return {
    roomId,
    role,
    userId,
    pairingToken,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
}

/**
 * Validates whether a pairing session token is active and unexpired
 */
export function isPairingSessionValid(
  session: NetflixPairingSession | null | undefined,
  expectedRoomId: string
): boolean {
  if (!session || !session.pairingToken || !session.roomId) return false;
  if (session.roomId !== expectedRoomId) return false;
  if (Date.now() > session.expiresAt) return false;
  return true;
}

// In-memory sender event rate tracker (sliding 1-second window)
const globalSenderRateMap = new Map<string, number[]>();

/**
 * Validates incoming playback events against Host Authority, sequence rules,
 * rate limits, and payload integrity.
 */
export function validateIncomingPlaybackEvent(
  event: Partial<NetflixPlaybackEvent> | null | undefined,
  currentState: NetflixRoomState,
  seenEventIds?: Set<string>,
  senderRateMap: Map<string, number[]> = globalSenderRateMap,
  now: number = Date.now()
): NetflixValidationResult {
  // 1. Structural check
  if (!event || typeof event !== "object") {
    return {
      valid: false,
      status: "REJECTED_INVALID_PAYLOAD",
      reason: "Missing or null event payload",
    };
  }

  if (
    !event.eventId ||
    typeof event.eventId !== "string" ||
    event.eventId.length > 128 ||
    !event.roomId ||
    typeof event.roomId !== "string" ||
    event.roomId.length > 128 ||
    typeof event.timestamp !== "number" ||
    isNaN(event.timestamp) ||
    !isFinite(event.timestamp) ||
    typeof event.sequence !== "number" ||
    isNaN(event.sequence) ||
    !isFinite(event.sequence)
  ) {
    return {
      valid: false,
      status: "REJECTED_INVALID_PAYLOAD",
      reason: "Missing or malformed mandatory event header fields (eventId, roomId, timestamp, sequence)",
    };
  }

  // 2. Room isolation validation
  if (event.roomId !== currentState.roomId) {
    return {
      valid: false,
      status: "REJECTED_ROOM_MISMATCH",
      reason: `Event roomId (${event.roomId}) does not match current room (${currentState.roomId})`,
    };
  }

  // Normalize type and role
  const eventType: NetflixEventType = (event.type || event.eventType) as NetflixEventType;
  const senderRole: NetflixSyncRole = (event.role || event.senderRole) as NetflixSyncRole;

  const validTypes = new Set([
    "PLAY",
    "PAUSE",
    "SEEK",
    "EPISODE_CHANGE",
    "INITIAL_SYNC",
    "RESYNC",
    "HEARTBEAT",
  ]);

  if (!eventType || !validTypes.has(eventType)) {
    return {
      valid: false,
      status: "REJECTED_INVALID_PAYLOAD",
      reason: `Unknown or unsupported event type: ${eventType}`,
    };
  }

  // Position sanitization: if provided, must be finite, non-negative number
  if (typeof event.position !== "undefined") {
    if (typeof event.position !== "number" || isNaN(event.position) || !isFinite(event.position) || event.position < 0) {
      return {
        valid: false,
        status: "REJECTED_INVALID_PAYLOAD",
        reason: "Invalid position: must be a non-negative finite number",
      };
    }
  }

  // SEEK and PLAY events must have a valid position
  if ((eventType === "SEEK" || eventType === "PLAY") && typeof event.position !== "number") {
    return {
      valid: false,
      status: "REJECTED_INVALID_PAYLOAD",
      reason: `Mandatory position field missing on ${eventType} event`,
    };
  }

  // MediaId sanitization on EPISODE_CHANGE
  if (eventType === "EPISODE_CHANGE") {
    if (!event.mediaId || typeof event.mediaId !== "string" || !/^[0-9a-zA-Z_-]{1,64}$/.test(event.mediaId)) {
      return {
        valid: false,
        status: "REJECTED_INVALID_PAYLOAD",
        reason: "Invalid mediaId: must be a valid alphanumeric identifier (max 64 chars)",
      };
    }
  }

  // 3. Host Authority & Role Validation
  // Authoritative commands can ONLY be dispatched by the verified Host
  const authoritativeTypes: NetflixEventType[] = [
    "PLAY",
    "PAUSE",
    "SEEK",
    "EPISODE_CHANGE",
    "INITIAL_SYNC",
    "RESYNC",
    "HEARTBEAT",
  ];

  if (authoritativeTypes.includes(eventType)) {
    if (senderRole !== "host") {
      return {
        valid: false,
        status: "REJECTED_UNAUTHORIZED_GUEST_COMMAND",
        reason: `Unauthorized command: Guests cannot publish authoritative ${eventType} events`,
      };
    }

    // If room has a known hostId, senderId must match
    if (currentState.hostId && event.senderId && event.senderId !== currentState.hostId) {
      return {
        valid: false,
        status: "REJECTED_UNAUTHORIZED_GUEST_COMMAND",
        reason: `Sender ${event.senderId} does not match authoritative host ${currentState.hostId}`,
      };
    }
  }

  // 4. Rate Limiting / Abuse Protection (Max 10 authoritative events per second per sender)
  if (event.senderId) {
    const senderTimes = senderRateMap.get(event.senderId) || [];
    const recentTimes = senderTimes.filter((t) => now - t < 1000);
    if (recentTimes.length >= 10) {
      return {
        valid: false,
        status: "REJECTED_RATE_LIMIT_EXCEEDED",
        reason: `Rate limit exceeded: sender ${event.senderId} emitted > 10 events/sec`,
      };
    }
    recentTimes.push(now);
    senderRateMap.set(event.senderId, recentTimes);
  }

  // 5. Duplicate-event protection
  if (seenEventIds && seenEventIds.has(event.eventId)) {
    return {
      valid: false,
      status: "REJECTED_DUPLICATE_EVENT",
      reason: `Duplicate event detected: eventId ${event.eventId} already processed`,
    };
  }

  // 6. Sequence validation & Stale-event rejection
  // Authoritative state change events MUST be strictly monotonically increasing
  if (eventType !== "HEARTBEAT") {
    if (event.sequence <= currentState.sequence) {
      return {
        valid: false,
        status: "REJECTED_STALE_SEQUENCE",
        reason: `Stale sequence: received #${event.sequence} but room is already at #${currentState.sequence}`,
      };
    }
  }

  // 7. Timestamp bounds validation (future skew <= 15s, historical replay <= 300s)
  if (event.timestamp > now + 15000) {
    return {
      valid: false,
      status: "REJECTED_TIMESTAMP_OUT_OF_BOUNDS",
      reason: `Event timestamp is too far in the future (+${(event.timestamp - now) / 1000}s clock skew)`,
    };
  }

  if (event.timestamp < now - 300000) {
    return {
      valid: false,
      status: "REJECTED_TIMESTAMP_OUT_OF_BOUNDS",
      reason: `Event timestamp is too old (-${(now - event.timestamp) / 1000}s stale skew)`,
    };
  }

  return {
    valid: true,
    status: "VALID",
  };
}

/**
 * Safely records seen event IDs into a bounded LRU cache to prevent memory exhaustion
 */
export function recordSeenEventId(seenSet: Set<string>, eventId: string, maxEntries: number = 1000): void {
  if (seenSet.size >= maxEntries) {
    const oldest = seenSet.values().next().value;
    if (oldest) seenSet.delete(oldest);
  }
  seenSet.add(eventId);
}

/**
 * State Reducer: applies an approved, valid playback event to compute the new room state
 */
export function applyPlaybackEvent(
  currentState: NetflixRoomState,
  event: NetflixPlaybackEvent
): NetflixRoomState {
  const eventType = event.type || event.eventType;
  const newSequence = Math.max(currentState.sequence, event.sequence);
  const newPosition = typeof event.position === "number" ? event.position : currentState.position;
  const newMediaId = event.mediaId || currentState.mediaId;

  let newIsPlaying = currentState.isPlaying;
  if (eventType === "PLAY") {
    newIsPlaying = true;
  } else if (eventType === "PAUSE") {
    newIsPlaying = false;
  } else if (eventType === "HEARTBEAT") {
    newIsPlaying = true;
  }

  return {
    ...currentState,
    isPlaying: newIsPlaying,
    position: newPosition,
    mediaId: newMediaId,
    lastUpdated: event.timestamp,
    sequence: newSequence,
  };
}

/**
 * Calculates the expected playback position of a host event, compensating for transmission latency
 */
export function calculateExpectedPlaybackPosition(
  event: Partial<NetflixPlaybackEvent>,
  now: number = Date.now()
): number {
  const basePosition = typeof event.position === "number" ? event.position : 0;
  const eventType = event.type || event.eventType;
  const isPlaying = eventType === "PLAY" || eventType === "HEARTBEAT";
  const latencySec = Math.max(0, (now - (event.timestamp || now)) / 1000);

  // If host is actively playing, add elapsed transmission time; if paused, expected position is frozen at event.position
  return Math.round((basePosition + (isPlaying ? latencySec : 0)) * 100) / 100;
}

/**
 * Drift Model: Calculates signed drift metrics between local guest position and host state
 */
export function calculateDrift(
  localGuestPosition: number,
  hostState: NetflixRoomState,
  now: number = Date.now()
): NetflixDriftMetrics {
  const elapsedSinceUpdateSec = hostState.isPlaying
    ? Math.max(0, (now - hostState.lastUpdated) / 1000)
    : 0;

  const estimatedHostPosition = hostState.position + elapsedSinceUpdateSec;
  const signedDrift = localGuestPosition - estimatedHostPosition;
  const absDrift = Math.abs(signedDrift);
  const latencyMs = Math.round(elapsedSinceUpdateSec * 1000);

  return {
    localGuestPosition: Math.round(localGuestPosition * 100) / 100,
    estimatedHostPosition: Math.round(estimatedHostPosition * 100) / 100,
    driftSeconds: Math.round(absDrift * 100) / 100,
    signedDriftSeconds: Math.round(signedDrift * 100) / 100,
    latencyMs,
    inSync: absDrift < 1.0,               // Smooth uninterrupted playback under 1.0s
    needsMinorNudge: absDrift >= 1.0 && absDrift < 2.5,
    needsSeekCorrection: absDrift >= 2.5, // Explicit seek correction required
  };
}

