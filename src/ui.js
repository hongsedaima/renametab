(function attachUi(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RenameTabUi = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createUi() {
  return {
    NEW_TITLE_PLACEHOLDER: '输入新的标签页标题',
  };
});
