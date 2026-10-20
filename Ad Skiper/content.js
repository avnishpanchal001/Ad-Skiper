/**
 * adskiper - Isolated Content Script (Manifest V3)
 * 
 * 1. Injects complete CSS shield erasing all YouTube banners, sidebar promos, and overlays.
 * 2. Injects injected.js into the MAIN world to access movie_player.skipAd() for 1000x instant skip.
 * 3. Bridges communication between storage and the page.
 */

(function () {
  'use strict';

  // 1. Instant Comprehensive CSS Shield: 100% Ad-Free YouTube Page
  const AD_ERADICATOR_CSS = `
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
  `;

  function injectCSS() {
    if (document.getElementById('adskiper-shield-css')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'adskiper-shield-css';
    styleEl.textContent = AD_ERADICATOR_CSS;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  injectCSS();

  // 2. Inject MAIN World Script
  function injectMainScript() {
    if (document.getElementById('adskiper-injected-script')) return;
    const script = document.createElement('script');
    script.id = 'adskiper-injected-script';
    script.src = chrome.runtime.getURL('injected.js');
    (document.head || document.documentElement).appendChild(script);
  }

  injectMainScript();

  // 3. Storage and Bridge
  chrome.storage.local.get({ enabled: true }, (res) => {
    window.postMessage({ type: 'ADSKIPER_STATE', enabled: res.enabled !== false }, '*');
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      window.postMessage({ type: 'ADSKIPER_STATE', enabled: changes.enabled.newValue !== false }, '*');
    }
  });

  // Count ads skipped from injected script
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
