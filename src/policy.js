(function attachPolicy(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RenameTabPolicy = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPolicy() {
  const STRATEGIES = Object.freeze({
    TAB_LIFETIME: 'tab_lifetime',
    SAME_URL: 'same_url',
    UNTIL_REFRESH: 'until_refresh',
  });

  const validStrategies = new Set(Object.values(STRATEGIES));

  function normalizeStrategy(strategy) {
    return validStrategies.has(strategy) ? strategy : STRATEGIES.TAB_LIFETIME;
  }

  function shouldStoreStrategy(strategy) {
    return normalizeStrategy(strategy) !== STRATEGIES.UNTIL_REFRESH;
  }

  function shouldReuseTitle(strategy, storedUrl, currentUrl) {
    const normalized = normalizeStrategy(strategy);
    if (normalized === STRATEGIES.TAB_LIFETIME) return true;
    if (normalized === STRATEGIES.SAME_URL) return storedUrl === currentUrl;
    return false;
  }

  function createTitleState(title, url, strategy) {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle) return null;

    return {
      title: trimmedTitle,
      url: String(url || ''),
      strategy: normalizeStrategy(strategy),
    };
  }

  return {
    STRATEGIES,
    normalizeStrategy,
    shouldStoreStrategy,
    shouldReuseTitle,
    createTitleState,
  };
});
