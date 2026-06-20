(function initializePopup() {
  const strategy = document.getElementById('strategy');
  const rename = document.getElementById('rename');
  const shortcuts = document.getElementById('shortcuts');
  const status = document.getElementById('status');
  const tabTitle = document.getElementById('tab-title');

  function setStatus(message) {
    status.textContent = message || '';
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: true });
      });
    });
  }

  async function saveStrategy() {
    const response = await sendMessage({ type: 'save-settings', strategy: strategy.value });
    if (!response.ok) setStatus(response.error);
  }

  async function load() {
    const response = await sendMessage({ type: 'get-current-tab-info' });
    if (!response.ok) {
      setStatus(response.error);
      return;
    }

    strategy.value = RenameTabPolicy.normalizeStrategy(response.settings && response.settings.strategy);
    tabTitle.textContent = response.tab && response.tab.title ? response.tab.title : 'Current tab';
  }

  strategy.addEventListener('change', saveStrategy);

  rename.addEventListener('click', async () => {
    await saveStrategy();
    const response = await sendMessage({ type: 'open-renamer', strategy: strategy.value });
    if (!response.ok) {
      setStatus(response.error || 'This page cannot be renamed.');
      return;
    }
    window.close();
  });

  shortcuts.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  load();
})();
