---
name: vscode-extension
description: Best practices and patterns for developing VSCode extensions. Covers extension anatomy, activation, command registration, contribution points, UX guidelines, storage APIs, bundling with webpack, and publishing. Trigger when working on VSCode extension code (extension.ts, package.json contributes, vscode API usage, commands, tree views, webviews) or when asked about VSCode extension development.
---

# VSCode Extension Development Best Practices

## Extension Anatomy

Every extension has two entry points:

```typescript
// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Register all disposables into context.subscriptions
  // They are automatically disposed when the extension deactivates
}

export function deactivate() {
  // Optional: explicit async cleanup
}
```

**Rule:** Always push disposables to `context.subscriptions`. Never leak listeners, watchers, or panels.

## Activation Events

Declare in `package.json` → `activationEvents`. Load lazily — prefer specific events over `*`.

| Event | When to use |
|-------|-------------|
| `onCommand:id` | Extension provides commands (VSCode 1.74+ auto-registers) |
| `onLanguage:id` | Language-specific features |
| `workspaceContains:glob` | Activates when matching file found in workspace |
| `onStartupFinished` | Needs to run after startup but not immediately |
| `*` | Never — activates on every startup, slows VSCode |

Since **VSCode 1.74+**, commands, views, and languages declared in `contributes` are auto-activated — `activationEvents` entries for those are optional.

## Command Registration

```typescript
// Good: push to subscriptions, use category prefix
context.subscriptions.push(
  vscode.commands.registerCommand('myExt.doSomething', async () => {
    // handler
  })
);

// Good: when/group for menu placement
// In package.json contributes.menus:
// "explorer/context": [{ "command": "myExt.doSomething", "when": "explorerResourceIsFolder", "group": "1_modification" }]
```

Command IDs must be namespaced: `<publisherId>.<commandName>`.

## Contribution Points Quick Reference

See [references/manifest-and-contributions.md](references/manifest-and-contributions.md) for full field list.

Key points in `package.json → contributes`:
- `commands` — title, icon, category, enablement condition
- `menus` — placement (`explorer/context`, `editor/title`, `view/title`, etc.)
- `configuration` — user settings with JSON schema
- `views` / `viewsContainers` — sidebar panels
- `keybindings` — keyboard shortcuts with `when` clauses

## Storage APIs

```typescript
// Workspace-scoped (per workspace)
context.workspaceState.get<T>('key', defaultValue);
context.workspaceState.update('key', value);

// Global (across all workspaces)
context.globalState.get<T>('key', defaultValue);
context.globalState.update('key', value);

// Secrets (encrypted, for tokens/passwords)
await context.secrets.store('token', value);
const token = await context.secrets.get('token');

// Large files (use URIs, not state)
const storageUri = context.globalStorageUri; // persist across sessions
```

## UX Patterns

- Use **Quick Picks** (`vscode.window.showQuickPick`) for multi-option selection
- Use **Input Box** (`vscode.window.showInputBox`) for single text input with validation
- Use **Output Channel** for logging (`vscode.window.createOutputChannel`)
- Use **Progress** for long operations (`vscode.window.withProgress`)
- Use **Status Bar Items** for persistent status — set `alignment` and `priority`
- **Avoid notifications for non-critical info** — prefer Output Channel or Status Bar

UX details → [references/ux-notifications-inputs.md](references/ux-notifications-inputs.md) | [references/ux-editor-and-advanced.md](references/ux-editor-and-advanced.md)

## Webviews

```typescript
const panel = vscode.window.createWebviewPanel(
  'myViewType', 'My Panel', vscode.ViewColumn.One,
  { enableScripts: true, retainContextWhenHidden: true }
);
context.subscriptions.push(panel);

// Bidirectional messaging
panel.webview.postMessage({ type: 'update', data });
panel.webview.onDidReceiveMessage(msg => { /* handle */ }, undefined, context.subscriptions);
```

Always set **CSP with nonce** and use **VSCode CSS variables** for theme support.
Full webview guide → [references/ux-editor-and-advanced.md](references/ux-editor-and-advanced.md)

## Tree Views

Implement `vscode.TreeDataProvider<T>`. Register with `vscode.window.createTreeView`.
Full pattern → [references/tree-view-pattern.md](references/tree-view-pattern.md)

## Workspace & File System

```typescript
// Always use vscode.workspace.fs for workspace files (supports remote: SSH/WSL)
const bytes = await vscode.workspace.fs.readFile(uri);
const entries = await vscode.workspace.fs.readDirectory(dirUri);

// Safe URI construction — never string concat
const child = vscode.Uri.joinPath(rootFolder.uri, 'src', 'index.ts');

// Watch for changes
const watcher = vscode.workspace.createFileSystemWatcher('**/*.hbs');
watcher.onDidChange(() => invalidateCache());
context.subscriptions.push(watcher);
```

Full API reference → [references/workspace-and-files.md](references/workspace-and-files.md)

## Testing

- Use **Jest + vscode mock** for unit/integration tests — no extension host needed
- Mock `vscode` at `src/test/__mocks__/vscode.ts` via `moduleNameMapper`
- Test commands by asserting on `vscode.window.showInformationMessage` / `showErrorMessage` calls
- Use `@vscode/test-cli` only for true E2E tests that need actual VSCode behavior

Full testing guide → [references/testing.md](references/testing.md)

## Bundling & Publishing

- Bundle with **webpack** or **esbuild** — never ship raw TypeScript
- Mark `vscode` as external in bundler config
- Use `.vscodeignore` to exclude `src/`, `node_modules/`, test files
- Run `vsce package` → inspect before publishing

Full checklist → [references/bundling-and-publishing.md](references/bundling-and-publishing.md)

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Not disposing resources | Push everything to `context.subscriptions` |
| Blocking `activate()` | Make it async, defer heavy work |
| String-concat paths | Use `vscode.Uri.joinPath` / `context.asAbsolutePath` |
| `import 'fs'` without protocol | Use `import * as fs from 'node:fs'` |
| Webview without CSP | Always set CSP with nonce in webview HTML |
| `*` activation event | Use specific events; 1.74+ auto-activates contributes |
| `node:fs` for workspace files | Use `vscode.workspace.fs` (supports remote workspaces) |
| Secrets in workspaceState | Use `context.secrets` for tokens/passwords |
