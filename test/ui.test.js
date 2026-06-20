const test = require('node:test');
const assert = require('node:assert/strict');

const ui = require('../src/ui.js');

test('uses one shared new-title placeholder', () => {
  assert.equal(ui.NEW_TITLE_PLACEHOLDER, '输入新的标签页标题');
});
