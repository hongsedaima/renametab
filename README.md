# RenameTab

RenameTab is a tiny Chrome extension for renaming the title of the tab you are looking at. Hit a shortcut, type a better name, press Enter, and the tab title changes in place.

It is useful for dashboards, long documentation pages, staging environments, AI chats, ticket queues, and any other tab whose original title is not the name you actually use in your head.

## Features

- Rename the current tab from the keyboard.
- Focused inline input with Enter to apply and Escape to cancel.
- Chrome-native customizable shortcut.
- Three refresh strategies:

| Strategy | Behavior |
| --- | --- |
| Keep while tab stays open | The custom title stays across reloads and navigations until the tab closes. |
| Keep while URL is unchanged | The custom title stays for reloads of the same exact URL and clears on URL change. |
| Restore after refresh | The custom title applies only to the current page load. |

## Install From Zip

1. Build or download `dist/RenameTab.zip`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Drag `dist/RenameTab.zip` onto the page. If your Chrome build asks for an unpacked extension, unzip it and choose the extracted folder with "Load unpacked".

## Usage

The default shortcut is `Alt+Shift+R` on Windows/Linux and `MacCtrl+Shift+R` on macOS.

To change it, open `chrome://extensions/shortcuts` and edit the "Rename current tab" command for RenameTab.

You can change the refresh strategy from the extension popup or the options page.

Submitting an empty title clears the custom title for the current tab.

## Build

```powershell
npm test
npm run package
```

The package command creates `dist/RenameTab.zip`.

## Privacy

RenameTab does not collect analytics, send network requests, or store browsing history. It stores only the title you enter, the tab URL needed for the selected strategy, and your default strategy setting in Chrome extension storage.
