const test = require('node:test');
const assert = require('node:assert/strict');

const shortcut = require('../src/shortcut.js');

test('formats the assigned rename command shortcut', () => {
  assert.equal(
    shortcut.getCommandShortcutText([
      { name: '_execute_action', shortcut: 'Ctrl+Shift+P' },
      { name: 'rename-current-tab', shortcut: 'Ctrl+Shift+Y' },
    ]),
    'Ctrl+Shift+Y',
  );
});

test('shows unset when the rename command has no shortcut', () => {
  assert.equal(
    shortcut.getCommandShortcutText([{ name: 'rename-current-tab', shortcut: '' }]),
    '未设置',
  );
});
