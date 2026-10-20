/**
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
});
