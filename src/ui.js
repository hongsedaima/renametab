(function attachUi(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RenameTabUi = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createUi() {
  function focusTitleInput(input, env) {
    if (!input) return;

    const runtime = env || {};
    const targetWindow = runtime.window || (typeof window !== 'undefined' ? window : null);
    const requestFrame = runtime.requestAnimationFrame
      || (typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : null);
    const setTimer = runtime.setTimeout
      || (typeof setTimeout === 'function' ? setTimeout.bind(globalThis) : null);

    const focus = () => {
      try {
        if (targetWindow && typeof targetWindow.focus === 'function') {
          targetWindow.focus();
        }
      } catch (error) {
        // Some pages can reject focus; the input retry below is still harmless.
      }

      try {
        input.focus({ preventScroll: true });
      } catch (error) {
        input.focus();
      }
    };

    focus();
    if (requestFrame) requestFrame(focus);
    if (setTimer) {
      setTimer(focus, 50);
      setTimer(focus, 150);
    }
  }

  function installUrlChangeListener(targetWindow, onChange) {
    if (!targetWindow || typeof onChange !== 'function') return;

    let lastUrl = targetWindow.location ? targetWindow.location.href : '';
    const setTimer = typeof targetWindow.setTimeout === 'function'
      ? targetWindow.setTimeout.bind(targetWindow)
      : (typeof setTimeout === 'function' ? setTimeout.bind(globalThis) : null);
    const setIntervalTimer = typeof targetWindow.setInterval === 'function'
      ? targetWindow.setInterval.bind(targetWindow)
      : null;

    const notifyIfChanged = () => {
      const nextUrl = targetWindow.location ? targetWindow.location.href : '';
      if (nextUrl === lastUrl) return;
      lastUrl = nextUrl;
      onChange(nextUrl);
    };

    const scheduleNotify = () => {
      if (setTimer) {
        setTimer(notifyIfChanged, 0);
        return;
      }
      notifyIfChanged();
    };

    ['pushState', 'replaceState'].forEach((method) => {
      const original = targetWindow.history && targetWindow.history[method];
      if (typeof original !== 'function') return;

      targetWindow.history[method] = function wrappedHistoryState() {
        const result = original.apply(this, arguments);
        scheduleNotify();
        return result;
      };
    });

    if (typeof targetWindow.addEventListener === 'function') {
      targetWindow.addEventListener('popstate', scheduleNotify);
      targetWindow.addEventListener('hashchange', scheduleNotify);
    }

    if (setIntervalTimer) {
      setIntervalTimer(notifyIfChanged, 250);
    }
  }

  return {
    NEW_TITLE_PLACEHOLDER: '输入新的标签页标题',
    focusTitleInput,
    installUrlChangeListener,
  };
});
