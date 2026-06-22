const test = require('node:test');
const assert = require('node:assert/strict');

const ui = require('../src/ui.js');

test('uses one shared new-title placeholder', () => {
  assert.equal(ui.NEW_TITLE_PLACEHOLDER, '输入新的标签页标题');
});

test('focuses title input immediately and retries after overlay insertion', () => {
  const calls = [];
  const scheduled = [];
  const input = {
    focus(options) {
      calls.push(['input.focus', options]);
    },
  };
  const env = {
    window: {
      focus() {
        calls.push(['window.focus']);
      },
    },
    requestAnimationFrame(callback) {
      scheduled.push(callback);
    },
    setTimeout(callback, delay) {
      calls.push(['setTimeout', delay]);
      scheduled.push(callback);
    },
  };

  ui.focusTitleInput(input, env);

  assert.deepEqual(calls[0], ['window.focus']);
  assert.deepEqual(calls[1], ['input.focus', { preventScroll: true }]);
  assert.deepEqual(calls.slice(2), [['setTimeout', 50], ['setTimeout', 150]]);

  scheduled.forEach((callback) => callback());

  assert.equal(calls.filter(([name]) => name === 'input.focus').length, 4);
});

test('notifies when single-page apps change the current URL', () => {
  const listeners = {};
  const timers = [];
  const changes = [];
  const win = {
    location: { href: 'https://github.test/issues?q=open' },
    history: {
      pushState() {
        win.location.href = 'https://github.test/issues/26';
        return 'pushed';
      },
      replaceState() {
        win.location.href = 'https://github.test/issues?q=closed';
        return 'replaced';
      },
    },
    addEventListener(name, callback) {
      listeners[name] = callback;
    },
    setTimeout(callback) {
      timers.push(callback);
    },
  };

  ui.installUrlChangeListener(win, (url) => changes.push(url));

  assert.equal(win.history.pushState({}, '', '/issues/26'), 'pushed');
  timers.shift()();
  assert.deepEqual(changes, ['https://github.test/issues/26']);

  assert.equal(win.history.replaceState({}, '', '/issues?q=closed'), 'replaced');
  timers.shift()();
  assert.deepEqual(changes, [
    'https://github.test/issues/26',
    'https://github.test/issues?q=closed',
  ]);

  win.location.href = 'https://github.test/issues?q=open';
  listeners.popstate();
  timers.shift()();

  assert.deepEqual(changes, [
    'https://github.test/issues/26',
    'https://github.test/issues?q=closed',
    'https://github.test/issues?q=open',
  ]);
});

test('polls for URL changes when page history hooks run outside the content script world', () => {
  const intervals = [];
  const changes = [];
  const win = {
    location: { href: 'https://github.test/issues?q=open' },
    history: {},
    addEventListener() {},
    setTimeout(callback) {
      callback();
    },
    setInterval(callback, delay) {
      intervals.push({ callback, delay });
    },
  };

  ui.installUrlChangeListener(win, (url) => changes.push(url));

  assert.equal(intervals.length, 1);
  assert.equal(intervals[0].delay, 250);

  win.location.href = 'https://github.test/issues/26';
  intervals[0].callback();

  assert.deepEqual(changes, ['https://github.test/issues/26']);
});
