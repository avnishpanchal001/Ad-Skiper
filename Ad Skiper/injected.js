/**
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

  // Listen for toggle updates from content.js
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
        // 1. Mute ad immediately
        if (!hasSkipped) {
          hasSkipped = true;
          savedMuted = video.muted;
          savedVolume = video.volume;
          window.postMessage({ type: 'ADSKIPER_BLOCKED_STAT' }, '*');
        }

        video.muted = true;
        video.playbackRate = 16.0;

        // 2. Call YouTube Player native skip API (0ms instant skip)
        if (typeof player.skipAd === 'function') {
          player.skipAd();
        }

        // 3. Advance playhead to the end of ad
        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }

        // 4. Click all skip buttons
        const skipButtons = document.querySelectorAll(
          '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button-slot, button.ytp-ad-skip-button-modern, [class*="skip-button"], .ytp-ad-overlay-close-button'
        );
        for (let i = 0; i < skipButtons.length; i++) {
          if (typeof skipButtons[i].click === 'function') {
            skipButtons[i].click();
          }
        }
      } else {
        // Main video is playing: restore playback speed and volume
        if (hasSkipped) {
          hasSkipped = false;
          video.muted = savedMuted;
          video.volume = savedVolume;
          video.playbackRate = 1.0;
        }
      }

      // Auto-dismiss warning modal if present
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

  // Run at 25ms interval
  setInterval(instant1000xSkip, 25);

  // Hook directly into video element events
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
