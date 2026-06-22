const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const contentSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');

function createContentContext(overrides = {}) {
  const messages = [];
  const context = {
    window: {},
    location: { href: 'https://example.test/' },
    document: {
      title: 'Example',
      documentElement: {
        append() {},
      },
      createElement(tagName) {
        return {
          tagName,
          className: '',
          id: '',
          style: {},
          type: '',
          value: '',
          textContent: '',
          setAttribute() {},
          addEventListener() {},
          append() {},
          remove() {},
          attachShadow() {
            return {
              append() {},
              querySelector() {
                return null;
              },
            };
          },
          focus() {},
        };
      },
    },
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(message, callback) {
          messages.push(message);
          callback({ ok: true, state: null });
        },
        onMessage: {
          addListener(listener) {
            context.messageListener = listener;
          },
        },
      },
    },
    MutationObserver: function MutationObserver() {
      return {
        observe() {},
        disconnect() {},
      };
    },
    requestAnimationFrame(callback) {
      callback();
    },
    setTimeout(callback) {
      callback();
    },
    console,
    messages,
  };

  context.window.location = context.location;
  context.window.addEventListener = function addEventListener() {};
  context.window.history = {};

  Object.assign(context, overrides);
  vm.createContext(context);
  return context;
}

test('content script starts even if shared UI helpers are not available', () => {
  const context = createContentContext();

  assert.doesNotThrow(() => {
    vm.runInContext(contentSource, context);
  });

  assert.deepEqual(JSON.parse(JSON.stringify(context.messages)), [
    { type: 'get-tab-state', url: 'https://example.test/' },
  ]);
});

test('content script ignores invalidated extension context send failures', async () => {
  const unhandled = [];
  const onUnhandled = (error) => unhandled.push(error);
  process.on('unhandledRejection', onUnhandled);

  try {
    const context = createContentContext({
      chrome: {
        runtime: {
          lastError: null,
          sendMessage() {
            throw new Error('Extension context invalidated.');
          },
          onMessage: {
            addListener(listener) {
              context.messageListener = listener;
            },
          },
        },
      },
    });

    assert.doesNotThrow(() => {
      vm.runInContext(contentSource, context);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(unhandled.map((error) => error.message), []);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

test('content script ignores rejected sendMessage promises from invalidated contexts', async () => {
  const unhandled = [];
  const onUnhandled = (error) => unhandled.push(error);
  process.on('unhandledRejection', onUnhandled);

  try {
    const context = createContentContext({
      chrome: {
        runtime: {
          lastError: null,
          sendMessage() {
            return Promise.reject(new Error('Extension context invalidated.'));
          },
          onMessage: {
            addListener(listener) {
              context.messageListener = listener;
            },
          },
        },
      },
    });

    assert.doesNotThrow(() => {
      vm.runInContext(contentSource, context);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(unhandled.map((error) => error.message), []);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});
