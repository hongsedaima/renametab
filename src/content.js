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
        width: min(560px, calc(100vw - 32px));
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        padding: 10px;
        border: 1px solid rgba(15, 23, 42, 0.18);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 18px 54px rgba(15, 23, 42, 0.2);
      }

      input {
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

      input:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
      }

      button {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 6px;
        color: #ffffff;
        background: #0f766e;
        font: 700 16px/1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        cursor: pointer;
      }

      button:hover {
        background: #115e59;
      }
    `;

    const panel = document.createElement('form');
    panel.className = 'panel';
    panel.setAttribute('aria-label', 'Rename tab');

    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'New tab title';
    input.value = desiredTitle || document.title || '';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'OK';
    submit.setAttribute('aria-label', 'Apply title');

    panel.append(input, submit);
    shadow.append(style, panel);
    document.documentElement.append(overlayHost);

    panel.addEventListener('submit', (event) => {
      event.preventDefault();
      commitTitle(input, strategy);
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
      createOverlay(RenameTabPolicy.normalizeStrategy(message.strategy));
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
