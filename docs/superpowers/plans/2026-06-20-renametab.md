# RenameTab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a Manifest V3 Chrome extension that renames the current tab title from a configurable keyboard shortcut and supports three refresh strategies.

**Architecture:** Use a background service worker for commands and tab-scoped state, a content script for the focused rename overlay and title lock, and shared pure policy helpers for strategy behavior. Store options in `chrome.storage.sync` and per-tab state in `chrome.storage.session`.

**Tech Stack:** Chrome Manifest V3, plain JavaScript, Node's built-in `node:test`, PowerShell `Compress-Archive`, GitHub CLI.

---

## File Structure

- `manifest.json`: Chrome extension manifest, command, permissions, scripts, popup, options, icons.
- `src/policy.js`: Pure shared strategy helpers.
- `src/background.js`: Service worker command handling and title state.
- `src/content.js`: Page overlay, title mutation lock, background messaging.
- `popup/popup.html`, `popup/popup.css`, `popup/popup.js`: Action popup.
- `options/options.html`, `options/options.css`, `options/options.js`: Strategy and shortcut settings.
- `scripts/build-zip.ps1`: Rebuilds `dist/RenameTab.zip`.
- `scripts/generate-icons.mjs`: Generates PNG icons without external dependencies.
- `test/policy.test.js`: Automated tests for strategy behavior.
- `README.md`: Star-friendly project overview, install, usage, strategy table.

### Task 1: Project Skeleton And Failing Policy Tests

**Files:**
- Create: `package.json`
- Create: `test/policy.test.js`

- [ ] **Step 1: Write failing tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/policy.js');

test('normalizes unknown strategies to tab lifetime', () => {
  assert.equal(policy.normalizeStrategy('same_url'), 'same_url');
  assert.equal(policy.normalizeStrategy('nonsense'), 'tab_lifetime');
  assert.equal(policy.normalizeStrategy(undefined), 'tab_lifetime');
});

test('decides when a stored title should be reused', () => {
  assert.equal(policy.shouldReuseTitle('tab_lifetime', 'https://a.test/one', 'https://b.test/two'), true);
  assert.equal(policy.shouldReuseTitle('same_url', 'https://a.test/one', 'https://a.test/one'), true);
  assert.equal(policy.shouldReuseTitle('same_url', 'https://a.test/one', 'https://a.test/two'), false);
  assert.equal(policy.shouldReuseTitle('until_refresh', 'https://a.test/one', 'https://a.test/one'), false);
});

test('creates trimmed state only for non-empty titles', () => {
  assert.deepEqual(policy.createTitleState('  Docs  ', 'https://a.test/', 'same_url'), {
    title: 'Docs',
    url: 'https://a.test/',
    strategy: 'same_url',
  });
  assert.equal(policy.createTitleState('   ', 'https://a.test/', 'same_url'), null);
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test`

Expected: fails because `../src/policy.js` does not exist.

### Task 2: Policy Helpers

**Files:**
- Create: `src/policy.js`
- Test: `test/policy.test.js`

- [ ] **Step 1: Implement minimal helpers**

```js
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
```

- [ ] **Step 2: Run tests and verify green**

Run: `npm test`

Expected: all policy tests pass.

### Task 3: Extension Runtime

**Files:**
- Create: `manifest.json`
- Create: `src/background.js`
- Create: `src/content.js`

- [ ] **Step 1: Implement manifest**

Define Manifest V3 metadata, `storage`, `activeTab`, and `scripting` permissions, `<all_urls>` content script matches, command `rename-current-tab`, action popup, options page, and icon paths.

- [ ] **Step 2: Implement background worker**

Handle command and popup messages by sending `open-renamer` to the active tab. Store title state in `chrome.storage.session` for `tab_lifetime` and `same_url`, clear state for `until_refresh`, clear closed tabs, and clear `same_url` state when the tab URL changes.

- [ ] **Step 3: Implement content script**

Render a shadow DOM overlay with a focused input, Enter submit, Escape cancel, blank clear, and a `MutationObserver` that keeps `document.title` equal to the custom title.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: policy tests stay green.

### Task 4: User Controls, Icons, And Docs

**Files:**
- Create: `popup/popup.html`
- Create: `popup/popup.css`
- Create: `popup/popup.js`
- Create: `options/options.html`
- Create: `options/options.css`
- Create: `options/options.js`
- Create: `scripts/generate-icons.mjs`
- Create: `README.md`

- [ ] **Step 1: Implement popup**

Add a compact popup with a rename button, current strategy selector, shortcut settings link, and status text.

- [ ] **Step 2: Implement options page**

Add radio controls for all three strategies and a shortcut settings link.

- [ ] **Step 3: Generate icons**

Use `node scripts/generate-icons.mjs` to create `assets/icon16.png`, `assets/icon32.png`, `assets/icon48.png`, and `assets/icon128.png`.

- [ ] **Step 4: Write README**

Explain install, usage, strategy behavior, Chrome shortcut customization, and repository positioning.

### Task 5: Packaging And Publish

**Files:**
- Create: `scripts/build-zip.ps1`
- Create: `dist/RenameTab.zip`

- [ ] **Step 1: Implement package script**

Copy extension runtime files into `dist/package` and compress them into `dist/RenameTab.zip`.

- [ ] **Step 2: Verify package**

Run: `npm test`

Run: `npm run package`

Run: `Get-ChildItem -Recurse dist/package | Select-Object FullName, Length`

Expected: tests pass, zip exists, package root contains `manifest.json`.

- [ ] **Step 3: Initialize git and publish**

Run `git init`, commit the finished project, create GitHub repository `renametab`, add `origin`, and push `main`.

## Self-Review

The plan covers shortcut invocation, input overlay, three refresh strategies, strategy configuration, zip packaging, README positioning, and GitHub publication. There are no placeholder tasks. Strategy names are consistent across the design and plan.
