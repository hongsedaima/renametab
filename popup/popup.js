(function initializePopup() {
  const form = document.getElementById('rename-form');
  const titleInput = document.getElementById('title');
  const strategy = document.getElementById('strategy');
  const openRenamer = document.getElementById('open-renamer');
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
    if (!response.ok) setStatus(response.error || '保存失败');
    return response;
  }

  async function load() {
    const response = await sendMessage({ type: 'get-current-tab-info' });
    if (!response.ok) {
      setStatus(response.error || '无法读取当前标签页');
      return;
    }

    strategy.value = RenameTabPolicy.normalizeStrategy(
      response.settings && response.settings.strategy ? response.settings.strategy : RenameTabPolicy.DEFAULT_STRATEGY,
    );
    tabTitle.textContent = response.tab && response.tab.title ? response.tab.title : '当前标签页';
    titleInput.focus();
  }

  strategy.addEventListener('change', saveStrategy);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    await saveStrategy();

    const response = await sendMessage({
      type: 'apply-title-to-active-tab',
      title: titleInput.value,
      strategy: strategy.value,
    });

    if (!response.ok) {
      setStatus(response.error || '当前页面无法修改 title');
      return;
    }

    window.close();
  });

  openRenamer.addEventListener('click', async () => {
    await saveStrategy();
    const response = await sendMessage({ type: 'open-renamer', strategy: strategy.value });
    if (!response.ok) {
      setStatus(response.error || '当前页面无法打开输入框');
      return;
    }
    window.close();
  });

  shortcuts.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  load();
})();
