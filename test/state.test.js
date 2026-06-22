const test = require('node:test');
const assert = require('node:assert/strict');

const state = require('../src/state.js');

test('stores reusable title state by tab id', () => {
  const next = state.saveTabTitle({}, 42, '  Inbox  ', 'https://mail.test/', 'tab_lifetime');

  assert.deepEqual(next, {
    42: {
      title: 'Inbox',
      url: 'https://mail.test/',
      strategy: 'tab_lifetime',
    },
  });
});

test('does not store until-refresh titles', () => {
  const next = state.saveTabTitle(
    { 42: { title: 'Old', url: 'https://mail.test/', strategy: 'tab_lifetime' } },
    42,
    'Inbox',
    'https://mail.test/',
    'until_refresh',
  );

  assert.deepEqual(next, {});
});

test('returns same-url state only when the current URL matches', () => {
  const states = {
    42: { title: 'Inbox', url: 'https://mail.test/', strategy: 'same_url' },
  };

  assert.deepEqual(state.getReusableTabTitle(states, 42, 'https://mail.test/'), states[42]);
  assert.equal(state.getReusableTabTitle(states, 42, 'https://mail.test/settings'), null);
});

test('keeps same-url state available after navigating away and back', () => {
  const states = state.saveTabTitle({}, 42, 'Inbox', 'https://mail.test/', 'same_url');
  const away = state.clearChangedUrlState(states, 42, 'https://mail.test/settings');

  assert.equal(state.getReusableTabTitle(away, 42, 'https://mail.test/settings'), null);
  assert.deepEqual(state.getReusableTabTitle(away, 42, 'https://mail.test/'), {
    title: 'Inbox',
    url: 'https://mail.test/',
    strategy: 'same_url',
  });
});

test('stores separate same-url titles for multiple URLs in one tab', () => {
  const first = state.saveTabTitle({}, 42, 'Inbox', 'https://mail.test/', 'same_url');
  const second = state.saveTabTitle(first, 42, 'Settings', 'https://mail.test/settings', 'same_url');

  assert.deepEqual(state.getReusableTabTitle(second, 42, 'https://mail.test/'), {
    title: 'Inbox',
    url: 'https://mail.test/',
    strategy: 'same_url',
  });
  assert.deepEqual(state.getReusableTabTitle(second, 42, 'https://mail.test/settings'), {
    title: 'Settings',
    url: 'https://mail.test/settings',
    strategy: 'same_url',
  });
});

test('matches same-url titles when equivalent query URLs use different encoding', () => {
  const storedUrl = 'https://github.com/hongsedaima-org/fengchacha/issues?q=is%3Aissue%20state%3Aopen%20label%3A%E6%80%81%3A%E5%BE%85%E9%AA%8C%E6%94%B6';
  const refreshedUrl = 'https://github.com/hongsedaima-org/fengchacha/issues?q=is%3Aissue+state%3Aopen+label%3A%E6%80%81%3A%E5%BE%85%E9%AA%8C%E6%94%B6';
  const states = state.saveTabTitle({}, 42, '待处理', storedUrl, 'same_url');

  assert.deepEqual(state.getReusableTabTitle(states, 42, refreshedUrl), {
    title: '待处理',
    url: storedUrl,
    strategy: 'same_url',
  });
});

test('prunes stored title state for closed tabs', () => {
  const states = {
    42: { title: 'Open', url: 'https://open.test/', strategy: 'tab_lifetime' },
    43: { title: 'Closed', url: 'https://closed.test/', strategy: 'tab_lifetime' },
    'same-url:42:https://open.test/issues?q=a+b': { title: 'Open Issues', url: 'https://open.test/issues?q=a%20b', strategy: 'same_url' },
    'same-url:43:https://closed.test/issues?q=a+b': { title: 'Closed Issues', url: 'https://closed.test/issues?q=a%20b', strategy: 'same_url' },
    'same-url-global:https://open.test/issues?q=a+b': { title: 'Open Issues', url: 'https://open.test/issues?q=a%20b', strategy: 'same_url' },
  };

  assert.deepEqual(state.pruneClosedTabStates(states, [42]), {
    42: { title: 'Open', url: 'https://open.test/', strategy: 'tab_lifetime' },
    'same-url:42:https://open.test/issues?q=a+b': { title: 'Open Issues', url: 'https://open.test/issues?q=a%20b', strategy: 'same_url' },
    'same-url-global:https://open.test/issues?q=a+b': { title: 'Open Issues', url: 'https://open.test/issues?q=a%20b', strategy: 'same_url' },
  });
});

test('falls back to URL-scoped same-url state when tab id changes', () => {
  const url = 'https://github.com/hongsedaima-org/fengchacha/issues?q=is%3Aissue%20state%3Aopen%20label%3A%E6%80%81%3A%E5%A4%84%E7%90%86%E4%B8%AD';
  const states = state.saveTabTitle({}, 42, '处理中', url, 'same_url');

  assert.deepEqual(state.getReusableTabTitle(states, 108, url), {
    title: '处理中',
    url,
    strategy: 'same_url',
  });
  assert.equal(state.getReusableTabTitle(states, 108, 'https://github.com/hongsedaima-org/fengchacha/issues/26'), null);
});

test('clears URL-scoped same-url state for the current URL', () => {
  const url = 'https://github.com/hongsedaima-org/fengchacha/issues?q=is%3Aissue%20state%3Aopen';
  const states = state.saveTabTitle({}, 42, '全部issues', url, 'same_url');

  assert.deepEqual(state.clearTabTitle(states, 42, url), {});
});
