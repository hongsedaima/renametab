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

test('clears same-url state when a tab navigates away', () => {
  const states = {
    42: { title: 'Inbox', url: 'https://mail.test/', strategy: 'same_url' },
    77: { title: 'Docs', url: 'https://docs.test/', strategy: 'tab_lifetime' },
  };

  assert.deepEqual(state.clearChangedUrlState(states, 42, 'https://mail.test/settings'), {
    77: { title: 'Docs', url: 'https://docs.test/', strategy: 'tab_lifetime' },
  });
  assert.deepEqual(state.clearChangedUrlState(states, 77, 'https://other.test/'), states);
});
