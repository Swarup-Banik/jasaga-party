/**
 * JASAGA Netflix Sync POC — Content Bridge (World: ISOLATED)
 * 
 * Sits in the isolated content script world and bridges:
 * - The extension runtime (chrome.runtime, popup, service worker)
 * - The Netflix page observer in the MAIN world via window.postMessage
 * 
 * Also observes SPA URL changes (from browse to watch, or between episodes).
 */

(function () {
  console.log("[JASAGA POC] Content Bridge mounted in ISOLATED world on netflix.com");

  let lastUrl = window.location.href;
  const pendingRequests = new Map();

  // Helper to send message to MAIN world observer
  function requestFromMainWorld(action, payload = null) {
    return new Promise((resolve) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        resolve({ error: "Timeout waiting for response from page observer" });
      }, 3000);

      pendingRequests.set(requestId, { resolve, timeout });

      window.postMessage(
        {
          target: "JASAGA_MAIN_OBSERVER",
          action,
          payload,
          requestId,
        },
        "*"
      );
    });
  }

  // Listen for responses from MAIN world
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.source !== "JASAGA_MAIN_OBSERVER") {
      return;
    }

    const { requestId, action, data } = event.data;

    if (requestId && pendingRequests.has(requestId)) {
      const { resolve, timeout } = pendingRequests.get(requestId);
      clearTimeout(timeout);
      pendingRequests.delete(requestId);
      resolve(data);
    } else if (action === "STATE_PUSH") {
      // Forward push telemetry to popup/background
      chrome.runtime.sendMessage({
        type: "NETFLIX_STATE_PUSH",
        data,
      }).catch(() => {
        // Popup may not be open, safe to ignore
      });
    } else if (action === "ACTION_PUSH") {
      // Forward discrete user action to service worker
      chrome.runtime.sendMessage({
        type: "NETFLIX_ACTION_PUSH",
        data,
      }).catch(() => {});
    }
  });

  // Listen for commands from Popup or Service Worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { command, payload } = message || {};

    (async () => {
      try {
        let result = null;
        switch (command) {
          case "PING":
            result = { pong: true, url: window.location.href };
            break;
          case "GET_STATE":
            result = await requestFromMainWorld("GET_STATE");
            break;
          case "PLAY":
            result = await requestFromMainWorld("PLAY");
            break;
          case "PAUSE":
            result = await requestFromMainWorld("PAUSE");
            break;
          case "SEEK":
            result = await requestFromMainWorld("SEEK", payload);
            break;
          case "STEP":
            result = await requestFromMainWorld("STEP", payload);
            break;
          case "RUN_DIAGNOSTICS":
            result = await requestFromMainWorld("RUN_DIAGNOSTICS");
            break;
          case "RUN_TEN_POINT_AUDIT":
            result = await requestFromMainWorld("RUN_TEN_POINT_AUDIT");
            break;
          default:
            result = { error: `Unknown command: ${command}` };
        }
        sendResponse(result);
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();

    return true; // Keep message channel open for async response
  });

  // Watch for SPA URL navigation changes (e.g. browse -> watch or episode auto-advance)
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      const old = lastUrl;
      lastUrl = currentUrl;
      console.log("[JASAGA POC] Netflix SPA navigation detected:", old, "->", currentUrl);

      chrome.runtime.sendMessage({
        type: "NETFLIX_NAVIGATION_CHANGE",
        from: old,
        to: currentUrl,
      }).catch(() => {});
    }
  }, 1000);
})();
