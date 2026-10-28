/**
 * JASAGA Netflix Sync Extension — JASAGA Webpage Bridge
 * 
 * Injected into JASAGA web origins (http://localhost:3000, https://jasaga.party).
 * Establishes secure communication between JASAGA Next.js application and the extension runtime.
 */

(function () {
  const EXTENSION_VERSION = "1.0.0";
  console.log(`[JASAGA Extension] Webpage Bridge mounted on ${window.location.origin} (v${EXTENSION_VERSION})`);

  // 1. Mark DOM for instantaneous synchronous detection (resilient across hydration)
  function markReady() {
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute("data-jasaga-netflix-ext", EXTENSION_VERSION);
        document.documentElement.dataset.jasagaNetflixExt = EXTENSION_VERSION;
      }
    } catch {
      // Ignore if document not ready
    }
  }
  markReady();

  // 2. Dispatch event for early listener hydration
  function notifyReady() {
    markReady();
    try {
      window.dispatchEvent(
        new CustomEvent("JASAGA_NETFLIX_EXT_READY", {
          detail: { version: EXTENSION_VERSION, origin: window.location.origin },
        })
      );
    } catch {
      // Ignore if window event dispatch unavailable
    }
  }
  notifyReady();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", notifyReady);
  }
  window.addEventListener("load", markReady);

  const ALLOWED_ORIGINS = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://jasaga.party",
    "http://jasaga.party",
    "https://jasaga-party.vercel.app",
    "http://jasaga-party.vercel.app",
  ]);

  // Enforce origin boundary
  if (!ALLOWED_ORIGINS.has(window.location.origin)) {
    console.warn(`[JASAGA Extension] Bridge execution blocked on untrusted origin: ${window.location.origin}`);
    return;
  }

  const ALLOWED_ACTIONS = new Set([
    "PING",
    "GET_STATUS",
    "PAIR_ROOM",
    "UNPAIR_ROOM",
    "EXECUTE_COMMAND",
    "NAVIGATE_TO_EPISODE",
  ]);

  const ALLOWED_COMMANDS = new Set([
    "PLAY",
    "PAUSE",
    "SEEK",
    "STEP",
    "GET_STATE",
  ]);

  // 3. Listen for requests from JASAGA Web Application
  window.addEventListener("message", (event) => {
    // Only accept same-window messages originating from strictly allowed origins
    if (event.source !== window || !ALLOWED_ORIGINS.has(event.origin) || event.origin !== window.location.origin) {
      return;
    }

    const message = event.data;
    if (!message || message.target !== "JASAGA_EXT_BRIDGE") {
      return;
    }

    const { requestId, action, payload } = message;

    // Validate action against whitelist
    if (!ALLOWED_ACTIONS.has(action)) {
      window.postMessage(
        {
          source: "JASAGA_EXT_BRIDGE",
          requestId,
          action,
          data: { error: `Unauthorized action: '${action}' is not permitted` },
        },
        window.location.origin
      );
      return;
    }

    // Direct synchronous PING
    if (action === "PING") {
      window.postMessage(
        {
          source: "JASAGA_EXT_BRIDGE",
          requestId,
          action: "PONG",
          data: {
            installed: true,
            version: EXTENSION_VERSION,
            origin: window.location.origin,
            timestamp: Date.now(),
          },
        },
        window.location.origin
      );
      return;
    }

    // Input Sanitization: Validate commands and parameters
    if (action === "EXECUTE_COMMAND") {
      const { command, args } = payload || {};
      if (!ALLOWED_COMMANDS.has(command)) {
        window.postMessage(
          {
            source: "JASAGA_EXT_BRIDGE",
            requestId,
            action,
            data: { error: `Invalid command: '${command}' is not supported` },
          },
          window.location.origin
        );
        return;
      }

      if (command === "SEEK") {
        const sec = args?.targetSeconds;
        if (typeof sec !== "number" || isNaN(sec) || !isFinite(sec) || sec < 0) {
          window.postMessage(
            {
              source: "JASAGA_EXT_BRIDGE",
              requestId,
              action,
              data: { error: "Invalid seek parameter: targetSeconds must be a finite, non-negative number" },
            },
            window.location.origin
          );
          return;
        }
      }
    } else if (action === "NAVIGATE_TO_EPISODE") {
      const mediaId = payload?.mediaId;
      if (!mediaId || typeof mediaId !== "string" || !/^[0-9a-zA-Z_-]{1,64}$/.test(mediaId)) {
        window.postMessage(
          {
            source: "JASAGA_EXT_BRIDGE",
            requestId,
            action,
            data: { error: "Invalid mediaId: must be a safe alphanumeric Netflix identifier" },
          },
          window.location.origin
        );
        return;
      }
    } else if (action === "PAIR_ROOM") {
      const roomId = payload?.roomId;
      if (!roomId || typeof roomId !== "string" || !/^[0-9a-zA-Z_-]{1,64}$/.test(roomId)) {
        window.postMessage(
          {
            source: "JASAGA_EXT_BRIDGE",
            requestId,
            action,
            data: { error: "Invalid roomId format" },
          },
          window.location.origin
        );
        return;
      }
    }

    // Forward to extension service worker
    chrome.runtime
      .sendMessage({
        type: "JASAGA_PAGE_REQUEST",
        action,
        payload,
        requestId,
      })
      .then((response) => {
        window.postMessage(
          {
            source: "JASAGA_EXT_BRIDGE",
            requestId,
            action,
            data: response,
          },
          window.location.origin
        );
      })
      .catch((err) => {
        window.postMessage(
          {
            source: "JASAGA_EXT_BRIDGE",
            requestId,
            action,
            data: { error: `Extension communication failed: ${err.message}` },
          },
          window.location.origin
        );
      });
  });

  // 4. Listen for push messages from Extension Service Worker
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;

    // Relay push notifications (e.g. Netflix player state changes, episode transitions, user actions) to web page
    if (
      msg.type === "NETFLIX_TELEMETRY_PUSH" ||
      msg.type === "NETFLIX_ACTION_PUSH" ||
      msg.type === "NETFLIX_STATUS_CHANGE" ||
      msg.type === "NETFLIX_TAB_CLOSED"
    ) {
      window.postMessage(
        {
          source: "JASAGA_EXT_BRIDGE",
          action: msg.type,
          data: msg.data,
        },
        window.location.origin
      );
      sendResponse({ received: true });
    }
  });

  // 5. Clean unpairing when window unloads
  window.addEventListener("beforeunload", () => {
    chrome.runtime
      .sendMessage({
        type: "JASAGA_PAGE_REQUEST",
        action: "UNPAIR_ROOM",
        payload: { reason: "window_unload" },
      })
      .catch(() => {});
  });
})();
