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
    return `same-url:${tabId}:${String(url || '')}`;
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
      delete next[tabKey(tabId)];
      next[sameUrlKey(tabId, url)] = titleState;
      return next;
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

    const titleState = tabTitleState;
    if (!titleState) return null;

    return policy.shouldReuseTitle(titleState.strategy, titleState.url, currentUrl) ? titleState : null;
  }

  function clearChangedUrlState(states, tabId, currentUrl) {
    return states || {};
  }

  return {
    saveTabTitle,
    clearTabTitle,
    getReusableTabTitle,
    clearChangedUrlState,
  };
});
