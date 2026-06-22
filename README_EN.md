# RenameTab

RenameTab is a lightweight Chrome extension that lets you rename the title of the current tab.

Use it for dashboards, documentation pages, staging environments, issue trackers, AI chat tabs, and any page whose original title is harder to recognize than the name you actually use.

## Highlights

- Rename the current tab directly from the extension popup.
- Open an in-page rename box with a keyboard shortcut.
- Customize the shortcut from Chrome's extension shortcut settings.
- Choose how long the custom title should stay active.
- No analytics, no network requests, and no account required.

## Title Persistence Modes

| Mode | Behavior |
| --- | --- |
| Restore when URL changes | Keeps the custom title for reloads of the same URL, then restores the page title after navigation. |
| Restore when tab closes | Keeps the custom title while the tab remains open. |
| Restore after refresh | Applies the custom title only to the current page load. |

## Install Manually

1. Download or build `dist/RenameTab.zip`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Drag the zip file into the page. If Chrome asks for an unpacked extension, unzip it and choose the extracted folder with **Load unpacked**.

## Usage

Open the extension popup, type a new title, choose the persistence mode, and submit.

The default shortcut is `Alt+R` (`Option+R` on macOS). Chrome may leave the shortcut blank if that key combination conflicts with another shortcut. To set or change it, open `chrome://extensions/shortcuts` and edit the RenameTab command.

Submitting an empty title clears the custom title for the current tab.

## Build

```powershell
npm test
npm run package
```

The package command creates `dist/RenameTab.zip`.

## Privacy

RenameTab does not collect analytics, send network requests, or store browsing history. It stores only the title you enter, the tab URL needed for the selected persistence mode, and your default mode setting in Chrome extension storage.
