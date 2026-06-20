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
