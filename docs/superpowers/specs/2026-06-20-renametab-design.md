# RenameTab Design

## Goal

RenameTab is a lightweight Chrome extension that lets a user rename the visible title of any supported tab from the keyboard. The title can be kept for the current tab, kept only while the URL stays the same, or allowed to reset on refresh.

## User Experience

The extension exposes a Chrome command named "Rename current tab" with a default shortcut. Users can customize the shortcut from `chrome://extensions/shortcuts`, which is Chrome's supported mechanism for extension keyboard shortcuts.

When the shortcut runs, the current page receives a focused inline input overlay. Pressing Enter applies the new title immediately. Pressing Escape cancels. Submitting an empty title clears the custom title and restores the page title that was present before the rename.

The action popup offers quick access to the same rename overlay and a link to the shortcut settings. The options page stores the refresh strategy.

## Strategies

`tab_lifetime`: The title is stored by Chrome tab ID in `chrome.storage.session`. It is reapplied after reloads and navigations in the same tab, and cleared when the tab closes.

`same_url`: The title is also stored by tab ID, but with the URL that was renamed. Reloading the same exact URL reapplies it. Navigating to a different URL clears it.

`until_refresh`: The title is applied only in the current document. It is not stored in the background state, so refresh or navigation restores the page's normal title.

## Architecture

`manifest.json` defines a Manifest V3 extension with a background service worker, content scripts, popup, options page, storage permission, active tab access, and a configurable command.

`src/policy.js` contains pure strategy helpers. It is written as a small UMD module so Node tests, the service worker, and browser pages can use the same logic.

`src/background.js` owns command handling and per-tab title state. It keeps durable per-tab state in `chrome.storage.session`, handles tab removal and URL changes, and asks the active tab to open the renamer.

`src/content.js` owns the page overlay and the actual `document.title` override. It uses a `MutationObserver` to keep the chosen title visible when the page tries to update the title.

`popup/` and `options/` provide the user-facing controls without taking over the main workflow.

## Error Handling

Unsupported browser pages such as `chrome://` cannot receive content scripts. The background service worker catches these failures and keeps the extension quiet instead of breaking.

Missing or invalid strategy values fall back to `tab_lifetime`.

Blank submitted titles clear any stored custom title for the tab.

## Testing

The first automated tests cover strategy normalization and persistence decisions in `src/policy.js`.

Manual verification covers content-script UI behavior because it depends on Chrome extension APIs and real page context.

Packaging verification checks that `dist/RenameTab.zip` contains the extension root files needed for Chrome installation.
