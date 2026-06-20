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

  function cloneStates(states) {
    return Object.assign({}, states || {});
  }

  function saveTabTitle(states, tabId, title, url, strategy) {
    const next = cloneStates(states);
    const key = tabKey(tabId);
    const normalized = policy.normalizeStrategy(strategy);
    const titleState = policy.createTitleState(title, url, normalized);

    if (!titleState || !policy.shouldStoreStrategy(normalized)) {
      delete next[key];
      return next;
    }

    next[key] = titleState;
    return next;
  }

  function clearTabTitle(states, tabId) {
    const next = cloneStates(states);
    delete next[tabKey(tabId)];
    return next;
  }

  function getReusableTabTitle(states, tabId, currentUrl) {
    const titleState = states && states[tabKey(tabId)];
    if (!titleState) return null;

    return policy.shouldReuseTitle(titleState.strategy, titleState.url, currentUrl) ? titleState : null;
  }

  function clearChangedUrlState(states, tabId, currentUrl) {
    const titleState = states && states[tabKey(tabId)];
    if (!titleState || policy.shouldReuseTitle(titleState.strategy, titleState.url, currentUrl)) {
      return states || {};
    }

    return clearTabTitle(states, tabId);
  }

  return {
    saveTabTitle,
    clearTabTitle,
    getReusableTabTitle,
    clearChangedUrlState,
  };
});
