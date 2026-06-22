(function attachState(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./policy.js'));
  } else {
    root.RenameTabState = factory(root.RenameTabPolicy);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createState(policy) {
  function tabKey(tabId) {
    return String(tabId);
  }

  function sameUrlKey(tabId, url) {
    return `same-url:${tabId}:${policy.normalizeUrlForMatch(url)}`;
  }

  function sameUrlGlobalKey(url) {
    return `same-url-global:${policy.normalizeUrlForMatch(url)}`;
  }

  function sameUrlPrefix(tabId) {
    return `same-url:${tabId}:`;
  }

  function cloneStates(states) {
    return Object.assign({}, states || {});
  }

  function removeTabEntries(states, tabId, url) {
    const next = cloneStates(states);
    delete next[tabKey(tabId)];

    if (typeof url === 'string') {
      delete next[sameUrlKey(tabId, url)];
      delete next[sameUrlGlobalKey(url)];
      const prefix = sameUrlPrefix(tabId);
      Object.keys(next).forEach((key) => {
        const titleState = next[key];
        if (key.startsWith(prefix) && titleState && policy.shouldReuseTitle(titleState.strategy, titleState.url, url)) {
          delete next[key];
        }
      });
      return next;
    }

    const prefix = sameUrlPrefix(tabId);
    Object.keys(next).forEach((key) => {
      if (key.startsWith(prefix)) delete next[key];
    });
    return next;
  }

  function saveTabTitle(states, tabId, title, url, strategy) {
    const next = cloneStates(states);
    const normalized = policy.normalizeStrategy(strategy);
    const titleState = policy.createTitleState(title, url, normalized);

    if (!titleState || !policy.shouldStoreStrategy(normalized)) {
      return removeTabEntries(next, tabId, url);
    }

    if (normalized === policy.STRATEGIES.SAME_URL) {
      const cleaned = removeTabEntries(next, tabId, url);
      cleaned[sameUrlKey(tabId, url)] = titleState;
      cleaned[sameUrlGlobalKey(url)] = titleState;
      return cleaned;
    }

    next[tabKey(tabId)] = titleState;
    return next;
  }

  function clearTabTitle(states, tabId, url) {
    return removeTabEntries(states, tabId, url);
  }

  function getReusableTabTitle(states, tabId, currentUrl) {
    const tabTitleState = states && states[tabKey(tabId)];
    if (tabTitleState && policy.normalizeStrategy(tabTitleState.strategy) === policy.STRATEGIES.TAB_LIFETIME) {
      return tabTitleState;
    }

    const sameUrlTitleState = states && states[sameUrlKey(tabId, currentUrl)];
    if (sameUrlTitleState) return sameUrlTitleState;

    const sameUrlGlobalTitleState = states && states[sameUrlGlobalKey(currentUrl)];
    if (sameUrlGlobalTitleState && policy.shouldReuseTitle(sameUrlGlobalTitleState.strategy, sameUrlGlobalTitleState.url, currentUrl)) {
      return sameUrlGlobalTitleState;
    }

    const prefix = sameUrlPrefix(tabId);
    const legacySameUrlKey = Object.keys(states || {}).find((key) => {
      const titleState = states[key];
      return key.startsWith(prefix) && titleState && policy.shouldReuseTitle(titleState.strategy, titleState.url, currentUrl);
    });
    if (legacySameUrlKey) return states[legacySameUrlKey];

    const titleState = tabTitleState;
    if (!titleState) return null;

    return policy.shouldReuseTitle(titleState.strategy, titleState.url, currentUrl) ? titleState : null;
  }

  function clearChangedUrlState(states, tabId, currentUrl) {
    return states || {};
  }

  function pruneClosedTabStates(states, openTabIds) {
    const next = cloneStates(states);
    const openIds = new Set((openTabIds || []).map((tabId) => String(tabId)));

    Object.keys(next).forEach((key) => {
      if (key.startsWith('same-url-global:')) return;

      const tabId = key.startsWith('same-url:')
        ? key.slice('same-url:'.length).split(':')[0]
        : key;

      if (!openIds.has(tabId)) {
        delete next[key];
      }
    });

    return next;
  }

  return {
    saveTabTitle,
    clearTabTitle,
    getReusableTabTitle,
    clearChangedUrlState,
    pruneClosedTabStates,
  };
});
