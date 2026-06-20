importScripts('policy.js', 'state.js');

const SETTINGS_KEY = 'renameTabSettings';
const STATES_KEY = 'renameTabStates';

const defaultSettings = {
  strategy: RenameTabPolicy.DEFAULT_STRATEGY,
};

function chromeCall(invoker) {
  return new Promise((resolve, reject) => {
    invoker((result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

async function storageGet(area, defaults) {
  return chromeCall((done) => chrome.storage[area].get(defaults, done));
}

async function storageSet(area, values) {
  await chromeCall((done) => chrome.storage[area].set(values, done));
}

async function readSettings() {
  const result = await storageGet('sync', { [SETTINGS_KEY]: defaultSettings });
  const settings = Object.assign({}, defaultSettings, result[SETTINGS_KEY] || {});
  settings.strategy = RenameTabPolicy.normalizeStrategy(settings.strategy);
  return settings;
}

async function writeSettings(settings) {
  const nextSettings = {
    strategy: RenameTabPolicy.normalizeStrategy(settings.strategy),
  };
  await storageSet('sync', { [SETTINGS_KEY]: nextSettings });
  return nextSettings;
}

async function readStates() {
  const result = await storageGet('session', { [STATES_KEY]: {} });
  return result[STATES_KEY] || {};
}

async function writeStates(states) {
  await storageSet('session', { [STATES_KEY]: states || {} });
}

async function getActiveTab() {
  const tabs = await chromeCall((done) => chrome.tabs.query({ active: true, currentWindow: true }, done));
  return tabs && tabs[0] ? tabs[0] : null;
}

async function ensureContentScripts(tabId) {
  await chromeCall((done) => chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/policy.js', 'src/content.js'],
  }, done));
}

async function sendTabMessage(tabId, message) {
  try {
    return await chromeCall((done) => chrome.tabs.sendMessage(tabId, message, done));
  } catch (firstError) {
    await ensureContentScripts(tabId);
    return chromeCall((done) => chrome.tabs.sendMessage(tabId, message, done));
  }
}

async function openRenamerForActiveTab(strategyOverride) {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    return { ok: false, error: '没有可操作的当前标签页' };
  }

  const settings = await readSettings();
  const strategy = RenameTabPolicy.normalizeStrategy(strategyOverride || settings.strategy);
  try {
    await sendTabMessage(tab.id, { type: 'open-renamer', strategy });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: '当前页面不支持修改 title' };
  }
}

async function applyTitleToActiveTab(title, strategyOverride) {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    return { ok: false, error: '没有可操作的当前标签页' };
  }

  const settings = await readSettings();
  const strategy = RenameTabPolicy.normalizeStrategy(strategyOverride || settings.strategy);
  const nextTitle = typeof title === 'string' ? title.trim() : '';
  const url = tab.url || '';

  try {
    if (!nextTitle) {
      await sendTabMessage(tab.id, { type: 'clear-title' });
      await handleClear(tab.id);
      return { ok: true };
    }

    await sendTabMessage(tab.id, { type: 'apply-title', title: nextTitle });
    const states = await readStates();
    const nextStates = RenameTabState.saveTabTitle(states, tab.id, nextTitle, url, strategy);
    await writeStates(nextStates);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: '当前页面不支持修改 title' };
  }
}

async function getTabState(tabId, url) {
  const states = await readStates();
  const titleState = RenameTabState.getReusableTabTitle(states, tabId, url);
  if (!titleState && states[String(tabId)]) {
    await writeStates(RenameTabState.clearTabTitle(states, tabId));
  }
  return titleState;
}

async function handleRename(tabId, message) {
  const states = await readStates();
  const nextStates = RenameTabState.saveTabTitle(
    states,
    tabId,
    message.title,
    message.url,
    message.strategy,
  );
  await writeStates(nextStates);
  return { ok: true };
}

async function handleClear(tabId) {
  const states = await readStates();
  await writeStates(RenameTabState.clearTabTitle(states, tabId));
  return { ok: true };
}

async function getCurrentTabInfo() {
  const tab = await getActiveTab();
  const settings = await readSettings();
  return {
    ok: true,
    tab: tab ? { id: tab.id, title: tab.title || '', url: tab.url || '' } : null,
    settings,
  };
}

async function handleMessage(message, sender) {
  if (!message || typeof message.type !== 'string') {
    return { ok: false, error: '未知操作' };
  }

  if (message.type === 'get-settings') {
    return { ok: true, settings: await readSettings() };
  }

  if (message.type === 'save-settings') {
    return { ok: true, settings: await writeSettings({ strategy: message.strategy }) };
  }

  if (message.type === 'open-renamer') {
    return openRenamerForActiveTab(message.strategy);
  }

  if (message.type === 'apply-title-to-active-tab') {
    return applyTitleToActiveTab(message.title, message.strategy);
  }

  if (message.type === 'get-current-tab-info') {
    return getCurrentTabInfo();
  }

  const tabId = sender && sender.tab && sender.tab.id;
  if (typeof tabId !== 'number') {
    return { ok: false, error: '没有可操作的当前标签页' };
  }

  if (message.type === 'get-tab-state') {
    return { ok: true, state: await getTabState(tabId, message.url) };
  }

  if (message.type === 'rename-tab') {
    return handleRename(tabId, message);
  }

  if (message.type === 'clear-tab-title') {
    return handleClear(tabId);
  }

  return { ok: false, error: '未知操作' };
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'rename-current-tab') {
    openRenamerForActiveTab();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readStates()
    .then((states) => writeStates(RenameTabState.clearTabTitle(states, tabId)))
    .catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;

  readStates()
    .then(async (states) => {
      const nextStates = RenameTabState.clearChangedUrlState(states, tabId, changeInfo.url);
      if (nextStates !== states) {
        await writeStates(nextStates);
        await sendTabMessage(tabId, { type: 'clear-title' }).catch(() => {});
      }
    })
    .catch(() => {});
});
