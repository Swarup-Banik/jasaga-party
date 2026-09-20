# JASAGA Netflix Sync Extension — Proof-of-Concept (POC)

A standalone Chrome/Edge (Manifest V3) extension designed to empirically evaluate whether legitimate local browser integration can observe and control video playback in a user's own Netflix tab, **without bypassing DRM, without extracting video, and without touching authentication credentials**.

---

## 🔒 Strict Security & Integrity Boundaries

1. **Zero Credential Access**: Never prompts for, reads, transmits, or stores Netflix passwords, cookies, or account tokens.
2. **Zero Media Decryption / Bypass**: Never touches Widevine CDM, EME decryption keys, or hardware DRM pipelines. Video streams are decoded natively by the browser.
3. **Zero Video Extraction**: Never records canvas pixels or downloads video chunks. Only numeric timestamps (e.g. `1243.20s`) and boolean play/pause states are observed.
4. **Completely Decoupled**: Operates 100% locally. Does not connect to Supabase, JASAGA backend, or external servers.

---

## 📂 Architecture

```
netflix-extension-poc/
├── manifest.json         # Chrome/Edge Manifest V3 specification
├── page-observer.js      # Runs in "world: MAIN" directly inside netflix.com context
├── content-bridge.js     # Runs in "world: ISOLATED" bridging extension runtime & page
├── service-worker.js     # Background worker tracking tab status & navigation
├── popup.html            # Diagnostic & test bench UI
├── popup.css             # Dark-theme styling
└── popup.js              # Telemetry polling, test action dispatchers & diagnostic parser
```

### Execution Worlds
- **`page-observer.js` (`world: MAIN`)**: Executes in Netflix's page context to inspect `document.querySelector('video')` and `window.netflix.appContext...`.
- **`content-bridge.js` (`world: ISOLATED`)**: Communicates with the extension popup and background service worker via `chrome.runtime`, forwarding messages across worlds via `window.postMessage`.

---

## 🚀 How to Load and Test in Chrome or Edge

1. Open **Google Chrome** or **Microsoft Edge**.
2. In the address bar, navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** (top-left button).
5. Select the directory:
   ```
   /Users/swarupbanik/Documents/Stream.agy/netflix-extension-poc
   ```
6. The extension **"JASAGA Netflix Sync POC"** will now appear in your browser toolbar!

---

## 🧪 Testing Steps

1. In the same browser, open any movie or anime episode on Netflix (e.g. `https://www.netflix.com/watch/81636287`).
2. Click the **JASAGA POC** extension icon in your browser toolbar to open the popup.
3. Observe:
   - **Tab Status**: Verifies that the Netflix watch tab and Episode ID are detected.
   - **Live Telemetry**: Confirms whether real-time position (`MM:SS.ss`) and state (`PLAYING` / `PAUSED`) are updating live.
4. Test Controls:
   - Click **`▶ Play`** / **`⏸ Pause`** to test remote control execution.
   - Click **`⏪ -10s`** / **`⏩ +10s`** to test step seeks.
   - Enter a target second (e.g. `120`) and click **`Seek to Time`**.
5. Run Full Diagnostic Scan:
   - Click **`⚡ Run Full Diagnostic Scan`**.
   - Review categorized results under:
     - **A. Confirmed Working**
     - **B. Partially Working**
     - **C. Not Working**
     - **D. Dependent on Undocumented Internals**
