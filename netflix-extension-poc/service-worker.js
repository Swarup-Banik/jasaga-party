/**
 * JASAGA Netflix Sync Extension — Background Service Worker
 * 
 * Manages extension lifecycle, tab tracking, room pairing state, and message routing.
 * Adheres to Manifest V3 ephemeral service worker specifications.
 */

console.log("[JASAGA Extension] Background Service Worker initialized");

// In-memory room pairing state
let currentPairing = {
  roomId: null,
  role: null, // "host" | "guest"
  pairedAt: null,
  jasagaTabId: null,
};

// Helper to locate active or any Netflix tab
async function getNetflixTab() {
  // Check active tab first
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.url && activeTab.url.includes("netflix.com")) {
    return activeTab;
  }

  // Otherwise check any open Netflix tab
  const netflixTabs = await chrome.tabs.query({ url: "*://*.netflix.com/*" });
  if (netflixTabs.length > 0) {
    // Prioritize watch page tabs
    const watchTab = netflixTabs.find((t) => t.url && t.url.includes("/watch/"));
    return watchTab || netflixTabs[0];
  }
  return null;
}

// Helper to locate open JASAGA tabs
async function getJasagaTabs() {
  try {
    return await chrome.tabs.query({
      url: [
        "http://localhost:3000/*",
        "http://127.0.0.1:3000/*",
        "https://jasaga.party/*",
      ],
    });
  } catch {
    return [];
  }
}

// Track tab updates (detect navigation to/from /watch/...)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes("netflix.com")) {
    const isWatch = changeInfo.url.includes("/watch/");
    console.log(`[JASAGA Extension] Netflix tab ${tabId} navigated to: ${changeInfo.url}`);

    if (isWatch) {
      await chrome.action.setBadgeText({ text: currentPairing.roomId ? "SYNC" : "LIVE" });
      await chrome.action.setBadgeBackgroundColor({ color: "#E50914" });
    } else {
      await chrome.action.setBadgeText({ text: currentPairing.roomId ? "ROOM" : "NF" });
      await chrome.action.setBadgeBackgroundColor({ color: "#333333" });
    }

    // Broadcast status change to JASAGA tabs
    const jasagaTabs = await getJasagaTabs();
    for (const jTab of jasagaTabs) {
      if (jTab.id) {
        chrome.tabs.sendMessage(jTab.id, {
          type: "NETFLIX_STATUS_CHANGE",
          data: {
            netflixUrl: changeInfo.url,
            isWatch,
            timestamp: Date.now(),
          },
        }).catch(() => {});
      }
    }
  }
});

// Clean up state when tabs are closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (currentPairing.jasagaTabId === tabId) {
    console.log(`[JASAGA Extension] Paired JASAGA tab ${tabId} was closed`);
    currentPairing = { roomId: null, role: null, pairedAt: null, jasagaTabId: null };
  }

  // If Netflix tab closed, notify JASAGA tabs
  const nTab = await getNetflixTab();
  if (!nTab) {
    const jasagaTabs = await getJasagaTabs();
    for (const jTab of jasagaTabs) {
      if (jTab.id) {
        chrome.tabs.sendMessage(jTab.id, {
          type: "NETFLIX_TAB_CLOSED",
          data: { timestamp: Date.now() },
        }).catch(() => {});
      }
    }
  }
});

// Central Message Routing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, action, payload } = message || {};

  // 1. Messages from JASAGA Web Application (via jasaga-bridge.js)
  if (type === "JASAGA_PAGE_REQUEST") {
    (async () => {
      try {
        switch (action) {
          case "GET_STATUS": {
            const netflixTab = await getNetflixTab();
            let playerState = null;
            if (netflixTab && netflixTab.id) {
              try {
                playerState = await chrome.tabs.sendMessage(netflixTab.id, { command: "GET_STATE" });
              } catch {
                // Tab may not have finished loading content script
              }
            }

            // Auto-expire pairing if TTL passed
            if (currentPairing.expiresAt && Date.now() > currentPairing.expiresAt) {
              console.log("[JASAGA Extension] Pairing token expired, resetting pairing");
              currentPairing = { roomId: null, role: null, pairedAt: null, jasagaTabId: null, pairingToken: null, expiresAt: null };
            }

            sendResponse({
              extensionVersion: "1.0.0",
              paired: !!currentPairing.roomId,
              pairing: currentPairing,
              netflixTab: netflixTab
                ? {
                    found: true,
                    tabId: netflixTab.id,
                    url: netflixTab.url || "",
                    isWatch: !!netflixTab.url && netflixTab.url.includes("/watch/"),
                    playerState,
                  }
                : {
                    found: false,
                    isWatch: false,
                    playerState: null,
                  },
            });
            break;
          }

          case "PAIR_ROOM": {
            const { roomId, role, userId, pairingToken, expiresAt } = payload || {};
            const now = Date.now();

            // Validate short-lived pairing session token
            if (expiresAt && now > expiresAt) {
              sendResponse({ success: false, error: "Pairing token has expired" });
              break;
            }

            currentPairing = {
              roomId: roomId || null,
              role: role === "host" ? "host" : "guest",
              userId: userId || null,
              pairingToken: pairingToken || `local_token_${now}`,
              expiresAt: expiresAt || (now + 15 * 60 * 1000),
              pairedAt: now,
              jasagaTabId: sender.tab?.id || null,
            };

            await chrome.action.setBadgeText({ text: role === "host" ? "HOST" : "SYNC" });
            await chrome.action.setBadgeBackgroundColor({ color: role === "host" ? "#9333ea" : "#2563eb" });

            console.log(`[JASAGA Extension] Successfully paired with Room #${roomId} as ${currentPairing.role} (Expires in ${Math.round((currentPairing.expiresAt - now) / 60000)}m)`);
            sendResponse({ success: true, pairing: currentPairing });
            break;
          }

          case "UNPAIR_ROOM": {
            currentPairing = { roomId: null, role: null, pairedAt: null, jasagaTabId: null };
            await chrome.action.setBadgeText({ text: "" });
            sendResponse({ success: true });
            break;
          }

          case "EXECUTE_COMMAND": {
            const netflixTab = await getNetflixTab();
            if (!netflixTab || !netflixTab.id) {
              sendResponse({ success: false, error: "No Netflix tab found" });
              return;
            }

            const { command, args } = payload || {};
            try {
              const execResult = await chrome.tabs.sendMessage(netflixTab.id, {
                command,
                payload: args,
              });
              sendResponse({ success: true, result: execResult });
            } catch (err) {
              sendResponse({ success: false, error: `Command dispatch failed: ${err.message}` });
            }
            break;
          }

          case "NAVIGATE_TO_EPISODE": {
            const { mediaId } = payload || {};
            if (!mediaId) {
              sendResponse({ success: false, error: "Missing mediaId parameter" });
              return;
            }

            const targetUrl = `https://www.netflix.com/watch/${mediaId}`;
            const netflixTab = await getNetflixTab();

            if (netflixTab && netflixTab.id) {
              await chrome.tabs.update(netflixTab.id, { url: targetUrl });
              sendResponse({ success: true, updated: true, tabId: netflixTab.id, targetUrl });
            } else {
              const newTab = await chrome.tabs.create({ url: targetUrl, active: false });
              sendResponse({ success: true, created: true, tabId: newTab.id, targetUrl });
            }
            break;
          }

          default:
            sendResponse({ error: `Unknown page request action: ${action}` });
        }
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }

  // 2. Telemetry forwarding from Netflix Content Bridge
  if (type === "NETFLIX_STATE_PUSH") {
    (async () => {
      const jasagaTabs = await getJasagaTabs();
      for (const jTab of jasagaTabs) {
        if (jTab.id) {
          chrome.tabs.sendMessage(jTab.id, {
            type: "NETFLIX_TELEMETRY_PUSH",
            data: message.data,
          }).catch(() => {});
        }
      }
    })();
    return false;
  }

  // 2b. Discrete user action forwarding from Netflix Content Bridge (Debounced & Loop-Protected)
  if (type === "NETFLIX_ACTION_PUSH") {
    (async () => {
      const jasagaTabs = await getJasagaTabs();
      for (const jTab of jasagaTabs) {
        if (jTab.id) {
          chrome.tabs.sendMessage(jTab.id, {
            type: "NETFLIX_ACTION_PUSH",
            data: message.data,
          }).catch(() => {});
        }
      }
    })();
    return false;
  }

  // 3. Direct queries from Extension Popup
  if (type === "GET_PAIRING_STATUS") {
    sendResponse({ pairing: currentPairing });
    return false;
  }

  if (type === "FIND_NETFLIX_TAB") {
    (async () => {
      const tab = await getNetflixTab();
      sendResponse({ tab });
    })();
    return true;
  }

  if (type === "FORWARD_TO_NETFLIX") {
    (async () => {
      const tab = await getNetflixTab();
      if (!tab || !tab.id) {
        sendResponse({ error: "No Netflix tab found" });
        return;
      }
      try {
        const response = await chrome.tabs.sendMessage(tab.id, message.payload);
        sendResponse(response);
      } catch (err) {
        sendResponse({ error: `Failed to communicate with Netflix tab: ${err.message}` });
      }
    })();
    return true;
  }

  return false;
});
