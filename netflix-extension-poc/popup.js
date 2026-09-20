/**
 * JASAGA Netflix Sync POC — Popup Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  // UI Elements
  const connectionPill = document.getElementById("connectionPill");
  const connectionText = document.getElementById("connectionText");
  const tabStatus = document.getElementById("tabStatus");
  const episodeIdEl = document.getElementById("episodeId");
  const sourceApiEl = document.getElementById("sourceApi");
  const pairedRoomEl = document.getElementById("pairedRoomEl");
  const pairedRoleEl = document.getElementById("pairedRoleEl");
  const playingBadge = document.getElementById("playingBadge");
  const currentTimeEl = document.getElementById("currentTime");
  const totalDurationEl = document.getElementById("totalDuration");
  const progressBar = document.getElementById("progressBar");

  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnStepForward = document.getElementById("btnStepForward");
  const btnSeek = document.getElementById("btnSeek");
  const seekInput = document.getElementById("seekInput");

  const btnRunDiagnostics = document.getElementById("btnRunDiagnostics");
  const diagnosticsSection = document.getElementById("diagnosticsSection");
  const btnCloseDiag = document.getElementById("btnCloseDiag");
  const listGroupA = document.getElementById("listGroupA");
  const listGroupB = document.getElementById("listGroupB");
  const listGroupC = document.getElementById("listGroupC");
  const listGroupD = document.getElementById("listGroupD");

  const btnRunAudit = document.getElementById("btnRunAudit");
  const auditSection = document.getElementById("auditSection");
  const btnCloseAudit = document.getElementById("btnCloseAudit");
  const auditSummaryBanner = document.getElementById("auditSummaryBanner");
  const auditList = document.getElementById("auditList");

  const logConsole = document.getElementById("logConsole");
  const btnClearLog = document.getElementById("btnClearLog");

  let activeTabId = null;
  let pollingInterval = null;

  // Log Helper
  function log(message, type = "info") {
    const time = new Date().toLocaleTimeString().split(" ")[0];
    const entry = document.createElement("div");
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${time}] ${message}`;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  btnClearLog.addEventListener("click", () => {
    logConsole.innerHTML = "";
  });

  // Helper to format seconds -> MM:SS.ss
  function formatSeconds(totalSec) {
    if (isNaN(totalSec) || totalSec < 0) totalSec = 0;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(2);
    return `${mins.toString().padStart(2, "0")}:${secs.padStart(5, "0")}`;
  }

  // Find target Netflix tab
  async function findNetflixTab() {
    try {
      // Check current active tab first
      const [current] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (current && current.url && current.url.includes("netflix.com")) {
        return current;
      }

      // Check any Netflix tab in any window
      const netflixTabs = await chrome.tabs.query({ url: "*://*.netflix.com/*" });
      if (netflixTabs.length > 0) {
        // Prioritize tabs on watch page
        const watchTab = netflixTabs.find((t) => t.url && t.url.includes("/watch/"));
        return watchTab || netflixTabs[0];
      }
      return null;
    } catch (e) {
      log(`Tab query error: ${e.message}`, "error");
      return null;
    }
  }

  // Send message safely to content script
  async function sendCommand(command, payload = null) {
    if (!activeTabId) {
      log("Cannot send: No active Netflix tab connected", "error");
      return null;
    }

    try {
      return await chrome.tabs.sendMessage(activeTabId, { command, payload });
    } catch (err) {
      log(`Error sending ${command}: ${err.message}`, "error");
      return null;
    }
  }

  // Update UI with incoming state data
  function renderState(state) {
    if (!state) return;

    // Episode & Page
    if (state.isWatchPage) {
      tabStatus.textContent = "Watching on Netflix";
      tabStatus.className = "value text-success";
      episodeIdEl.textContent = state.episodeId || "Unknown";
    } else {
      tabStatus.textContent = "Browsing Netflix (Not in video)";
      tabStatus.className = "value text-muted";
      episodeIdEl.textContent = "None";
    }

    // Source API
    sourceApiEl.textContent = state.activeSource || "None";

    // Play/Pause
    if (state.isPlaying) {
      playingBadge.textContent = "● PLAYING";
      playingBadge.className = "badge badge-playing";
    } else {
      playingBadge.textContent = "⏸ PAUSED";
      playingBadge.className = "badge badge-paused";
    }

    // Timecode
    const cur = state.currentTimeSec || 0;
    const dur = state.durationSec || 0;
    currentTimeEl.textContent = formatSeconds(cur);
    totalDurationEl.textContent = formatSeconds(dur);

    // Progress Bar
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  // Poll state periodically
  async function pollState() {
    const res = await sendCommand("GET_STATE");
    if (res) {
      renderState(res);
    }
  }

  // Check room pairing status
  async function updatePairingStatus() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_PAIRING_STATUS" });
      if (res && res.pairing && res.pairing.roomId) {
        pairedRoomEl.textContent = `#${res.pairing.roomId}`;
        pairedRoleEl.textContent = res.pairing.role === "host" ? "👑 Host (Authoritative)" : "👥 Guest (Synced)";
        pairedRoleEl.style.color = res.pairing.role === "host" ? "#c084fc" : "#60a5fa";
      } else {
        pairedRoomEl.textContent = "Not Paired";
        pairedRoleEl.textContent = "--";
        pairedRoleEl.style.color = "";
      }
    } catch {
      // Ignore
    }
  }

  // Initialize Connection
  async function init() {
    await updatePairingStatus();
    log("Scanning for open Netflix tabs...");
    const tab = await findNetflixTab();

    if (!tab || !tab.id) {
      connectionPill.className = "pill pill-offline";
      connectionText.textContent = "No Netflix Tab";
      tabStatus.textContent = "Open netflix.com/watch/...";
      log("No Netflix tab found. Please open Netflix in a browser tab.", "warn");
      return;
    }

    activeTabId = tab.id;
    connectionPill.className = "pill pill-online";
    connectionText.textContent = "Tab Connected";
    log(`Connected to Netflix tab (ID: ${tab.id})`, "success");

    // Ping tab to check content script injection
    const ping = await sendCommand("PING");
    if (ping && ping.pong) {
      log("Content bridge & Page observer verified active", "success");
    } else {
      log("Content script not responding yet. Refresh the Netflix tab if needed.", "warn");
    }

    // Immediate state query
    await pollState();

    // Start 1-second telemetry loop
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
      await pollState();
      await updatePairingStatus();
    }, 1000);
  }

  // Command Button Listeners
  btnPlay.addEventListener("click", async () => {
    log("Sending command: PLAY...");
    const res = await sendCommand("PLAY");
    if (res) {
      log(`PLAY result: ${res.method} -> ${res.logs?.join("; ") || "done"}`, res.success ? "success" : "error");
      await pollState();
    }
  });

  btnPause.addEventListener("click", async () => {
    log("Sending command: PAUSE...");
    const res = await sendCommand("PAUSE");
    if (res) {
      log(`PAUSE result: ${res.method} -> ${res.logs?.join("; ") || "done"}`, res.success ? "success" : "error");
      await pollState();
    }
  });

  btnStepBack.addEventListener("click", async () => {
    log("Sending command: STEP -10s...");
    const res = await sendCommand("STEP", { deltaSeconds: -10 });
    if (res) {
      log(`STEP -10 result: ${res.logs?.join("; ") || "done"}`, res.success ? "success" : "error");
      await pollState();
    }
  });

  btnStepForward.addEventListener("click", async () => {
    log("Sending command: STEP +10s...");
    const res = await sendCommand("STEP", { deltaSeconds: 10 });
    if (res) {
      log(`STEP +10 result: ${res.logs?.join("; ") || "done"}`, res.success ? "success" : "error");
      await pollState();
    }
  });

  btnSeek.addEventListener("click", async () => {
    const val = parseFloat(seekInput.value);
    if (isNaN(val) || val < 0) {
      log("Please enter a valid seek time in seconds", "warn");
      return;
    }
    log(`Sending command: SEEK to ${val}s...`);
    const res = await sendCommand("SEEK", { targetSeconds: val });
    if (res) {
      log(`SEEK result: ${res.logs?.join("; ") || "done"}`, res.success ? "success" : "error");
      await pollState();
    }
  });

  // Diagnostics Scan
  btnRunDiagnostics.addEventListener("click", async () => {
    log("Running full diagnostic probe on active Netflix tab...", "info");
    const diag = await sendCommand("RUN_DIAGNOSTICS");

    if (!diag) {
      log("Diagnostics failed: no response from Netflix tab", "error");
      return;
    }

    log("Diagnostics completed! Rendering breakdown...", "success");

    // Populate Group A
    listGroupA.innerHTML = "";
    (diag.categoryA || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listGroupA.appendChild(li);
    });

    // Populate Group B
    listGroupB.innerHTML = "";
    (diag.categoryB || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listGroupB.appendChild(li);
    });

    // Populate Group C
    listGroupC.innerHTML = "";
    (diag.categoryC || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listGroupC.appendChild(li);
    });

    // Populate Group D
    listGroupD.innerHTML = "";
    (diag.categoryD || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listGroupD.appendChild(li);
    });

    diagnosticsSection.classList.remove("hidden");
  });

  btnCloseDiag.addEventListener("click", () => {
    diagnosticsSection.classList.add("hidden");
  });

  // 10-Point Capability Verification Suite Listener
  btnRunAudit.addEventListener("click", async () => {
    log("Executing 10-Point Capability Audit on active Netflix session...", "info");
    const res = await sendCommand("RUN_TEN_POINT_AUDIT");

    if (!res || !res.tests) {
      log("Audit failed: no response from Netflix tab. Verify a Netflix video is currently playing.", "error");
      return;
    }

    log(`Audit completed: ${res.summary.passed} PASSED, ${res.summary.partial} PARTIAL, ${res.summary.failed} FAILED`, "success");

    auditSummaryBanner.innerHTML = `
      <span style="color: #34d399;">PASS: ${res.summary.passed}</span> • 
      <span style="color: #fbbf24;">PARTIAL: ${res.summary.partial}</span> • 
      <span style="color: #f87171;">FAIL: ${res.summary.failed}</span>
    `;

    auditList.innerHTML = "";
    res.tests.forEach((t) => {
      const item = document.createElement("div");
      const badgeClass =
        t.status === "PASS"
          ? "audit-badge-pass"
          : t.status === "PARTIAL"
          ? "audit-badge-partial"
          : "audit-badge-fail";
      const itemClass =
        t.status === "PASS"
          ? "audit-item-pass"
          : t.status === "PARTIAL"
          ? "audit-item-partial"
          : "audit-item-fail";

      item.className = `audit-item ${itemClass}`;
      item.innerHTML = `
        <div class="audit-header-row">
          <strong style="color: #f1f5f9;">${t.name}</strong>
          <span class="${badgeClass}">${t.status}</span>
        </div>
        <div class="audit-observed">${t.observed}</div>
        ${t.limitation ? `<div class="audit-limitation">Limitation: ${t.limitation}</div>` : ""}
      `;
      auditList.appendChild(item);
    });

    auditSection.classList.remove("hidden");
  });

  btnCloseAudit.addEventListener("click", () => {
    auditSection.classList.add("hidden");
  });

  // Listen for pushes from background / content bridge
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NETFLIX_STATE_PUSH" && message.data) {
      renderState(message.data);
    } else if (message.type === "NETFLIX_NAVIGATION_CHANGE") {
      log(`Netflix SPA Navigation: -> ${message.to}`, "info");
      pollState();
    }
  });

  init();
});
