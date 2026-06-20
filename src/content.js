(function initializeRenameTabContent() {
  if (window.__renameTabContentInitialized) return;
  window.__renameTabContentInitialized = true;

  let desiredTitle = null;
  let originalTitle = null;
  let titleObserver = null;
  let overlayHost = null;

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

  function disconnectObserver() {
    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }
  }

  function keepTitleLocked() {
    disconnectObserver();
    titleObserver = new MutationObserver(() => {
      if (desiredTitle && document.title !== desiredTitle) {
        document.title = desiredTitle;
      }
    });
    titleObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function applyTitle(title) {
    const nextTitle = String(title || '').trim();
    if (!nextTitle) return;

    if (originalTitle === null) {
      originalTitle = document.title;
    }

    desiredTitle = nextTitle;
    if (document.title !== desiredTitle) {
      document.title = desiredTitle;
    }
    keepTitleLocked();
  }

  function clearTitle(restoreOriginal) {
    desiredTitle = null;
    disconnectObserver();

    if (restoreOriginal && originalTitle !== null) {
      document.title = originalTitle;
    }
    originalTitle = null;
  }

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove();
      overlayHost = null;
    }
  }

  async function commitTitle(input, strategy) {
    const title = input.value.trim();
    removeOverlay();

    if (!title) {
      clearTitle(true);
      await sendMessage({ type: 'clear-tab-title', url: location.href });
      return;
    }

    applyTitle(title);
    await sendMessage({
      type: 'rename-tab',
      title,
      strategy,
      url: location.href,
    });
  }

  function createOverlay(strategy) {
    removeOverlay();
    const selectedStrategy = RenameTabPolicy.normalizeStrategy(strategy || RenameTabPolicy.DEFAULT_STRATEGY);

    overlayHost = document.createElement('div');
    overlayHost.id = 'renametab-overlay';
    const shadow = overlayHost.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: none;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .panel {
        pointer-events: auto;
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        width: min(620px, calc(100vw - 32px));
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 1px solid rgba(15, 23, 42, 0.18);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 18px 54px rgba(15, 23, 42, 0.2);
      }

      .title-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }

      .title-input {
        min-width: 0;
        height: 38px;
        border: 1px solid #b9c3d2;
        border-radius: 6px;
        padding: 0 12px;
        color: #111827;
        background: #ffffff;
        font: 500 14px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        outline: none;
      }

      .title-input:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
      }

      .submit {
        min-width: 72px;
        height: 38px;
        border: 0;
        border-radius: 6px;
        padding: 0 14px;
        color: #ffffff;
        background: #0f766e;
        font: 700 14px/1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        cursor: pointer;
      }

      .submit:hover {
        background: #115e59;
      }

      fieldset {
        display: grid;
        gap: 6px;
        margin: 0;
        border: 0;
        padding: 0;
      }

      legend {
        margin-bottom: 2px;
        color: #475569;
        font: 700 12px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      label {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        align-items: center;
        min-height: 24px;
        color: #172033;
        font: 13px/1.25 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      input[type="radio"] {
        accent-color: #0f766e;
      }
    `;

    const panel = document.createElement('form');
    panel.className = 'panel';
    panel.setAttribute('aria-label', '重命名标签页');

    const titleRow = document.createElement('div');
    titleRow.className = 'title-row';

    const input = document.createElement('input');
    input.className = 'title-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = '新 title';
    input.value = desiredTitle || document.title || '';

    const submit = document.createElement('button');
    submit.className = 'submit';
    submit.type = 'submit';
    submit.textContent = '提交';
    submit.setAttribute('aria-label', '提交新 title');

    titleRow.append(input, submit);

    const scope = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = '生效范围';
    scope.append(legend);

    [
      ['same_url', '更改 URL 后恢复默认 title'],
      ['tab_lifetime', '关闭标签页后恢复默认 title'],
      ['until_refresh', '刷新后恢复默认 title'],
    ].forEach(([value, labelText]) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'renametab-strategy';
      radio.value = value;
      radio.checked = value === selectedStrategy;

      const text = document.createElement('span');
      text.textContent = labelText;
      label.append(radio, text);
      scope.append(label);
    });

    panel.append(titleRow, scope);
    shadow.append(style, panel);
    document.documentElement.append(overlayHost);

    panel.addEventListener('submit', (event) => {
      event.preventDefault();
      const checked = shadow.querySelector('input[name="renametab-strategy"]:checked');
      commitTitle(input, checked ? checked.value : RenameTabPolicy.DEFAULT_STRATEGY);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        removeOverlay();
      }
    });

    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message.type !== 'string') return false;

    if (message.type === 'open-renamer') {
      createOverlay(RenameTabPolicy.normalizeStrategy(message.strategy || RenameTabPolicy.DEFAULT_STRATEGY));
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'apply-title') {
      applyTitle(message.title);
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'clear-title') {
      clearTitle(true);
      sendResponse({ ok: true });
      return true;
    }

    return false;
  });

  sendMessage({ type: 'get-tab-state', url: location.href }).then((response) => {
    if (response && response.ok && response.state && response.state.title) {
      applyTitle(response.state.title);
    }
  });
})();
