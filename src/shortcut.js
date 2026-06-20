(function attachShortcut(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RenameTabShortcut = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createShortcut() {
  const RENAME_COMMAND = 'rename-current-tab';
  const UNSET_TEXT = '未设置';

  function getCommandShortcutText(commands) {
    const command = Array.isArray(commands)
      ? commands.find((candidate) => candidate && candidate.name === RENAME_COMMAND)
      : null;
    return command && command.shortcut ? command.shortcut : UNSET_TEXT;
  }

  return {
    RENAME_COMMAND,
    UNSET_TEXT,
    getCommandShortcutText,
  };
});
