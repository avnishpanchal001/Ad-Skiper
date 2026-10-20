/**
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
