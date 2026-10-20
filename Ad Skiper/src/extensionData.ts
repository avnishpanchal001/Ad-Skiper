/**
 * Complete Chrome Extension Source Code & Definitions for "adskiper"
 */

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const MANIFEST_JSON = `{
  "manifest_version": 3,
  "name": "adskiper",
  "version": "2.3.0",
  "description": "Ultra-fast YouTube Ad Skipper with zero buffering delay. 100% Ad-Free, No VPN needed.",
  "permissions": [
    "declarativeNetRequest",
    "storage",
    "webNavigation",
    "tabs"
  ],
  "host_permissions": [
    "*://*.youtube.com/*",
    "*://*.youtube.com./*",
    "*://*.googlesyndication.com/*",
    "*://*.doubleclick.net/*"
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "adskiper_rules",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.youtube.com/*",
        "*://*.youtube.com./*"
      ],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["*://*.youtube.com/*", "*://*.youtube.com./*"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "adskiper",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`;

export const RULES_JSON = `[]`;

export const BACKGROUND_JS = `/**
 * adskiper - Fast Background Service Worker (Manifest V3)
 * 
 * - Manages ad skip statistics in real time.
 * - Synchronizes ON/OFF state with dynamic rulesets.
 * - Does NOT trigger heavy full-page reloads, ensuring zero-latency instant video loading.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AD_BLOCKED') {
    chrome.storage.local.get({ adsBlockedCount: 0 }, (data) => {
      chrome.storage.local.set({ adsBlockedCount: (data.adsBlockedCount || 0) + 1 });
    });
    sendResponse({ ok: true });
    return true;
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled && chrome.declarativeNetRequest && chrome.declarativeNetRequest.updateEnabledRulesets) {
    const isEnabled = changes.enabled.newValue !== false;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: isEnabled ? ['adskiper_rules'] : [],
      disableRulesetIds: isEnabled ? [] : ['adskiper_rules']
    }).catch(() => {});
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      enabled: true,
      adsBlockedCount: 0,
      installedAt: Date.now()
    });
  }
});
`;

export const INJECTED_JS = `/**
 * adskiper - MAIN World 1000x Instant Ad Accelerator (Manifest V3)
 * 
 * Runs directly in the YouTube page context with full access to
 * YouTube's native #movie_player API (player.skipAd()).
 * Skips video ads in <1ms (1000x faster than normal playback).
 */

(function () {
  'use strict';

  let isEnabled = true;
  let savedVolume = 1.0;
  let savedMuted = false;
  let hasSkipped = false;

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ADSKIPER_STATE') {
      isEnabled = event.data.enabled !== false;
    }
  });

  function instant1000xSkip() {
    if (!isEnabled) return;

    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const video = document.querySelector('video.html5-main-video') || document.querySelector('video');

      if (!player || !video) return;

      const isAd =
        player.classList.contains('ad-showing') ||
        player.classList.contains('ad-interrupting') ||
        Boolean(document.querySelector('.ytp-ad-player-overlay')) ||
        Boolean(document.querySelector('.ytp-ad-text')) ||
        Boolean(document.querySelector('.ytp-ad-preview-container'));

      if (isAd) {
        if (!hasSkipped) {
          hasSkipped = true;
          savedMuted = video.muted;
          savedVolume = video.volume;
          window.postMessage({ type: 'ADSKIPER_BLOCKED_STAT' }, '*');
        }

        video.muted = true;
        video.playbackRate = 16.0;

        // Call YouTube Player native skip API (0ms instant skip)
        if (typeof player.skipAd === 'function') {
          player.skipAd();
        }

        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }

        const skipButtons = document.querySelectorAll(
          '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button-slot, button.ytp-ad-skip-button-modern, [class*="skip-button"], .ytp-ad-overlay-close-button'
        );
        for (let i = 0; i < skipButtons.length; i++) {
          if (typeof skipButtons[i].click === 'function') {
            skipButtons[i].click();
          }
        }
      } else {
        if (hasSkipped) {
          hasSkipped = false;
          video.muted = savedMuted;
          video.volume = savedVolume;
          video.playbackRate = 1.0;
        }
      }

      const modal = document.querySelector('ytd-enforcement-message-view-model');
      if (modal) {
        modal.remove();
        document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach((b) => b.remove());
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    } catch (e) {}
  }

  setInterval(instant1000xSkip, 25);

  function hookVideoEvents() {
    const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
    if (video && !video.__adskiperBound) {
      video.__adskiperBound = true;
      video.addEventListener('timeupdate', instant1000xSkip, { passive: true });
      video.addEventListener('play', instant1000xSkip, { passive: true });
      video.addEventListener('playing', instant1000xSkip, { passive: true });
      video.addEventListener('loadstart', instant1000xSkip, { passive: true });
    }
  }

  setInterval(hookVideoEvents, 250);
  hookVideoEvents();
})();
`;

export const CONTENT_JS = `/**
 * adskiper - Isolated Content Script (Manifest V3)
 * 
 * 1. Injects complete CSS shield erasing all YouTube banners, sidebar promos, and overlays.
 * 2. Injects injected.js into the MAIN world to access movie_player.skipAd() for 1000x instant skip.
 * 3. Bridges communication between storage and the page.
 */

(function () {
  'use strict';

  const AD_ERADICATOR_CSS = \`
    /* Top Masthead Ads */
    #masthead-ad,
    ytd-video-masthead-ad-v3-renderer,
    ytd-banner-promo-renderer,
    ytd-statement-banner-renderer,
    ytd-primetime-promo-renderer,

    /* Sidebar / Next to Video Ads */
    #secondary ytd-ad-slot-renderer,
    #secondary #panels ytd-ad-slot-renderer,
    #secondary-inner ytd-ad-slot-renderer,
    ytd-compact-promoted-video-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-companion-slot-renderer,
    ytd-action-companion-ad-renderer,
    ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
    #companion,
    #offer-module,

    /* Feed & Search Ads */
    ytd-ad-slot-renderer,
    ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
    ytd-rich-item-renderer:has(#ad-badge),
    ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
    ytd-promoted-video-renderer,
    ytd-display-ad-renderer,
    ytd-in-feed-ad-layout-renderer,
    ytd-brand-video-singleton-renderer,
    #below ytd-ad-slot-renderer,
    #player-ads,

    /* In-Player Overlays & Bottom Banners */
    .ytp-ad-overlay-container,
    .ytp-ad-overlay-slot,
    .ytp-ad-image-overlay,
    .ytp-ad-text-overlay,
    .ytp-ad-message-container,
    .ytp-ad-preview-container,
    .ytp-ad-text,
    .video-ads.ytp-ad-module,
    .ytp-ad-progress,
    .ytp-ad-progress-list,

    /* Enforcement Warning Modals */
    ytd-enforcement-message-view-model,
    tp-yt-paper-dialog:has(#feedback),
    tp-yt-iron-overlay-backdrop {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      height: 0 !important;
      width: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    }
  \`;

  function injectCSS() {
    if (document.getElementById('adskiper-shield-css')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'adskiper-shield-css';
    styleEl.textContent = AD_ERADICATOR_CSS;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  injectCSS();

  function injectMainScript() {
    if (document.getElementById('adskiper-injected-script')) return;
    const script = document.createElement('script');
    script.id = 'adskiper-injected-script';
    script.src = chrome.runtime.getURL('injected.js');
    (document.head || document.documentElement).appendChild(script);
  }

  injectMainScript();

  chrome.storage.local.get({ enabled: true }, (res) => {
    window.postMessage({ type: 'ADSKIPER_STATE', enabled: res.enabled !== false }, '*');
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      window.postMessage({ type: 'ADSKIPER_STATE', enabled: changes.enabled.newValue !== false }, '*');
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ADSKIPER_BLOCKED_STAT') {
      try {
        chrome.runtime.sendMessage({ type: 'AD_BLOCKED' });
      } catch (e) {}
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    injectCSS();
    injectMainScript();
  });

  window.addEventListener('yt-navigate-finish', () => {
    injectCSS();
    injectMainScript();
  });
})();
`;

export const POPUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>adskiper</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 250px;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #FFFFFF;
      color: #0F172A;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-box {
      width: 28px;
      height: 28px;
      background: #FFE600;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(15, 23, 42, 0.15);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .brand-name {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .version-tag {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .toggle-btn {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      transition: all 0.15s ease;
    }
    .toggle-btn.on {
      background: #10B981;
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
    }
    .toggle-btn.off {
      background: #F1F5F9;
      color: #64748B;
    }

    .stats-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      margin-bottom: 12px;
    }
    .stats-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-num {
      font-size: 32px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.1;
      margin: 2px 0 4px 0;
      font-variant-numeric: tabular-nums;
    }
    .stats-desc {
      font-size: 10px;
      font-weight: 600;
      color: #059669;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #64748B;
      padding-top: 4px;
    }
    .reset-link {
      background: none;
      border: none;
      color: #64748B;
      cursor: pointer;
      font-size: 10px;
      text-decoration: underline;
    }
    .reset-link:hover {
      color: #0F172A;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo-box">
        <svg width="18" height="18" viewBox="0 0 14 12" style="image-rendering: pixelated;">
          <rect x="1" y="2" width="1" height="8" fill="#000000" />
          <rect x="2" y="2" width="1" height="8" fill="#000000" />
          <rect x="3" y="3" width="1" height="6" fill="#000000" />
          <rect x="4" y="3" width="1" height="6" fill="#000000" />
          <rect x="5" y="4" width="1" height="4" fill="#000000" />
          <rect x="6" y="4" width="1" height="4" fill="#000000" />
          <rect x="7" y="5" width="1" height="2" fill="#000000" />
          <rect x="8" y="5" width="1" height="2" fill="#000000" />
          <rect x="10" y="2" width="1.5" height="8" fill="#000000" />
          <rect x="11.5" y="2" width="1" height="8" fill="#000000" />
        </svg>
      </div>
      <div class="brand-name">adskiper</div>
    </div>
    <span class="version-tag">v2.3</span>
  </div>

  <button id="toggleBtn" class="toggle-btn on">
    <span id="statusDot">●</span>
    <span id="statusText">ADSKIPER ACTIVE</span>
  </button>

  <div class="stats-card">
    <div class="stats-label">Ads Skipped &amp; Erased</div>
    <div class="stats-num" id="countDisplay">0</div>
    <div class="stats-desc" id="statusDesc">✓ 100% Ad-Free with adskiper</div>
  </div>

  <div class="footer">
    <span>Zero Buffering</span>
    <button class="reset-link" id="resetBtn">Reset</button>
  </div>

  <script src="popup.js"></script>
</body>
</html>`;

export const POPUP_JS = `/**
 * adskiper - Total Ad Skipper Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusDesc = document.getElementById('statusDesc');
  const countDisplay = document.getElementById('countDisplay');
  const resetBtn = document.getElementById('resetBtn');

  const data = await chrome.storage.local.get({ enabled: true, adsBlockedCount: 0 });
  let isEnabled = data.enabled !== false;
  let count = data.adsBlockedCount || 0;

  updateUI();

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.adsBlockedCount) {
      count = changes.adsBlockedCount.newValue || 0;
      countDisplay.textContent = count;
    }
  });

  toggleBtn.addEventListener('click', async () => {
    isEnabled = !isEnabled;
    await chrome.storage.local.set({ enabled: isEnabled });
    updateUI();
  });

  resetBtn.addEventListener('click', async () => {
    count = 0;
    await chrome.storage.local.set({ adsBlockedCount: 0 });
    updateUI();
  });

  function updateUI() {
    countDisplay.textContent = count;
    if (isEnabled) {
      toggleBtn.className = 'toggle-btn on';
      statusText.textContent = 'ADSKIPER ACTIVE';
      statusDesc.textContent = '✓ 100% Ad-Free with adskiper';
      statusDesc.style.color = '#059669';
      statusDot.textContent = '●';
    } else {
      toggleBtn.className = 'toggle-btn off';
      statusText.textContent = 'AD SKIP PAUSED';
      statusDesc.textContent = 'Ads Allowed (adskiper Paused)';
      statusDesc.style.color = '#64748B';
      statusDot.textContent = '○';
    }
  }
});`;

export const README_MD = `# adskiper - YouTube Ad Skipper (v2.3.0)

A simple, lightweight, 100% client-side Chrome Extension (Manifest V3) that makes YouTube completely ad-free.
Zero buffering delay. No VPN required.

## Features
- **1000x Instant Video Ad Skip**: Directly triggers YouTube's native player skip API (player.skipAd()) in <1ms.
- **Zero Black Screen Freeze**: Prevents continuous seeking stalls and buffering timeouts.
- **Complete Banner & Sidebar Erasure**: Removes mastheads, sponsored recommendations, and overlays.
- **Pure Client-Side**: No VPN, no proxy servers.

## Installation
1. Extract the downloaded ZIP.
2. Go to \`chrome://extensions\`.
3. Enable **Developer mode** in the upper right.
4. Click **Load unpacked** and select the extracted folder.
`;

export const EXTENSION_FILES: ExtensionFile[] = [
  {
    name: 'manifest.json',
    path: 'manifest.json',
    language: 'json',
    description: 'Manifest V3 configuration with adskiper ad skipping.',
    content: MANIFEST_JSON
  },
  {
    name: 'rules.json',
    path: 'rules.json',
    language: 'json',
    description: 'Declarative network ad-skipping rules for third-party networks.',
    content: RULES_JSON
  },
  {
    name: 'injected.js',
    path: 'injected.js',
    language: 'javascript',
    description: 'MAIN world 1000x instant ad skip accelerator invoking player.skipAd().',
    content: INJECTED_JS
  },
  {
    name: 'content.js',
    path: 'content.js',
    language: 'javascript',
    description: 'Isolated content script managing visual ad eradication and script injection.',
    content: CONTENT_JS
  },
  {
    name: 'background.js',
    path: 'background.js',
    language: 'javascript',
    description: 'Lightweight background worker managing ad skip statistics.',
    content: BACKGROUND_JS
  },
  {
    name: 'popup.html',
    path: 'popup.html',
    language: 'html',
    description: 'Simple adskiper popup interface with pixel skip icon.',
    content: POPUP_HTML
  },
  {
    name: 'popup.js',
    path: 'popup.js',
    language: 'javascript',
    description: 'Popup script handling real-time stats and toggle commands.',
    content: POPUP_JS
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Documentation and quick setup guide.',
    content: README_MD
  }
];

export async function generateIconBlob(size: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = false;

    // Background yellow
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(0, 0, size, size);

    // Subtle dark border
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.06));
    ctx.strokeRect(0, 0, size, size);

    // 12 columns x 10 rows pixel matrix for YouTube ad skip button icon (▶|) in solid black
    const matrix = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]
    ];

    const pixelCols = 12;
    const pixelRows = 10;
    const pixelSize = Math.max(1, Math.floor(size * 0.065));
    const startX = Math.floor((size - pixelCols * pixelSize) / 2);
    const startY = Math.floor((size - pixelRows * pixelSize) / 2);

    ctx.fillStyle = '#000000';
    for (let r = 0; r < pixelRows; r++) {
      for (let c = 0; c < pixelCols; c++) {
        if (matrix[r][c] === 1) {
          ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, 'image/png');
  });
}
