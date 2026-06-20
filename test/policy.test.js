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
