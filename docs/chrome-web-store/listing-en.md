# Chrome Web Store Listing - English

## Name

RenameTab

## Summary

Rename the current Chrome tab title and control when the custom title resets.

## Category

Productivity

## Language

English

## Detailed Description

RenameTab helps you keep busy browser windows readable by letting you rename the title of any supported Chrome tab.

Use the popup to type a new title, or assign a keyboard shortcut and open the in-page rename box without leaving the page. RenameTab is useful for dashboards, documentation, staging environments, issue trackers, AI chat tabs, and any page whose default title is too vague or too long.

You can choose how long a custom title stays active:

- Restore when URL changes
- Restore when the tab closes
- Restore after refresh

RenameTab runs locally in your browser. It does not collect analytics, does not make network requests, and does not require an account.

## Single Purpose

RenameTab lets users set a custom title for the active Chrome tab and choose when that custom title should reset.

## Permission Justifications

### activeTab

Used to apply a custom title to the currently active tab after the user invokes the extension.

### scripting

Used to inject the title-renaming content script into the active tab when needed.

### storage

Used to store local extension settings and tab title state.

### tabs

Used to identify the active tab and monitor tab URL changes so RenameTab can restore the original page title according to the selected persistence mode.

### Host permissions

RenameTab needs to run on normal web pages so users can rename arbitrary supported tabs. The extension does not read page content beyond setting and preserving `document.title`.

## Remote Code

No remote code is used.

## Data Use

RenameTab does not collect or transmit user data. Custom titles, tab URLs needed for persistence, and settings are stored locally in Chrome extension storage only.

## Test Instructions

1. Install the extension.
2. Open any normal HTTPS page, such as a documentation page.
3. Open the RenameTab popup.
4. Enter a new title and click Submit.
5. Confirm the browser tab title changes.
6. Change the persistence mode and verify reload or URL navigation resets the title according to that mode.
7. Optional: assign a keyboard shortcut at `chrome://extensions/shortcuts` and use it to open the in-page rename box.
