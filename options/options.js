(function initializeOptions() {
  const status = document.getElementById('status');
  const shortcuts = document.getElementById('shortcuts');
  const inputs = Array.from(document.querySelectorAll('input[name="strategy"]'));

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

  function setStatus(message) {
    status.textContent = message || '';
  }

  async function load() {
    const response = await sendMessage({ type: 'get-settings' });
    if (!response.ok) {
      setStatus(response.error);
      return;
    }

    const current = RenameTabPolicy.normalizeStrategy(response.settings && response.settings.strategy);
    const input = inputs.find((candidate) => candidate.value === current);
    if (input) input.checked = true;
  }

  async function save(value) {
    const response = await sendMessage({ type: 'save-settings', strategy: value });
    if (response.ok) {
      setStatus('Saved');
    } else {
      setStatus(response.error);
    }
  }

  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) save(input.value);
    });
  });

  shortcuts.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  load();
})();
