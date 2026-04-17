# UX: Editor, Webviews & Advanced Patterns

## Webview — Theme-Aware Styling

Always use VSCode CSS variables so webviews respect the active theme:

```html
<style>
  body {
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
  }
  button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 4px 12px;
    cursor: pointer;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  input {
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    padding: 4px 6px;
  }
  .list-item:hover { background: var(--vscode-list-hoverBackground); }
  .list-item.selected { background: var(--vscode-list-activeSelectionBackground); }
</style>
```

## Webview — Content Security Policy (CSP)

Always set CSP to prevent XSS. Use a per-load nonce for inline scripts:

```typescript
function getWebviewContent(webview: vscode.Webview, nonce: string): string {
  const cspSource = webview.cspSource;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${cspSource} 'unsafe-inline';
             script-src 'nonce-${nonce}';
             img-src ${cspSource} https: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    // post messages to extension: vscode.postMessage({ type: 'ready' })
    // receive: window.addEventListener('message', e => { const msg = e.data; })
  </script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
```

## Webview — Bidirectional Messaging

```typescript
// Extension → Webview
panel.webview.postMessage({ type: 'update', payload: data });

// Webview → Extension (in extension host)
panel.webview.onDidReceiveMessage(
  message => {
    switch (message.type) {
      case 'save': handleSave(message.payload); break;
      case 'cancel': panel.dispose(); break;
    }
  },
  undefined,
  context.subscriptions
);

// In webview JS (acquireVsCodeApi() call must be exactly once per page)
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'save', payload: formData });
window.addEventListener('message', event => {
  const { type, payload } = event.data;
  if (type === 'update') renderData(payload);
});
```

## Editor Decorations

Highlight ranges in the editor (inline warnings, annotations, gutter icons):

```typescript
const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
  borderRadius: '2px',
  after: {
    contentText: ' ← template variable',
    color: new vscode.ThemeColor('editorCodeLens.foreground'),
    fontStyle: 'italic',
    margin: '0 0 0 8px',
  },
  gutterIconPath: context.asAbsolutePath('assets/gutter-icon.svg'),
  gutterIconSize: 'contain',
});
context.subscriptions.push(decorationType);

// Apply — call again to update, call with [] to clear
function applyDecorations(editor: vscode.TextEditor) {
  const ranges: vscode.DecorationOptions[] = [
    { range: new vscode.Range(0, 0, 0, 10), hoverMessage: 'This is a variable' }
  ];
  editor.setDecorations(decorationType, ranges);
}

// Update on editor change
context.subscriptions.push(
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) applyDecorations(editor);
  })
);
```

## Diagnostics (Problems Panel)

```typescript
const diagnostics = vscode.languages.createDiagnosticCollection('myExt');
context.subscriptions.push(diagnostics);

function updateDiagnostics(uri: vscode.Uri, issues: Array<{ range: vscode.Range; message: string }>) {
  diagnostics.set(uri, issues.map(({ range, message }) =>
    new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning)
  ));
}

diagnostics.clear();         // clear all files
diagnostics.delete(uri);     // clear one file
```

## When Clauses (Context Keys)

Control command/menu visibility:

```
explorerResourceIsFolder         — selected item is a folder
explorerResourceIsRoot           — selected is workspace root
editorTextFocus                  — editor has keyboard focus
editorHasSelection               — text is selected
editorLangId == typescript       — active editor language
resourceExtname == .ts           — file extension match
resourceFilename == package.json — exact filename match
view == myExt.treeViewId         — specific view is active
viewItem == dependency           — tree item contextValue match
isWorkspaceTrusted               — workspace trust granted
config.myExt.enabled             — setting is truthy
```

Set custom context keys from extension code:

```typescript
vscode.commands.executeCommand('setContext', 'myExt.hasTemplates', true);
// Use in package.json when clause: "myExt.hasTemplates"
```

## Menu Groups & Separators

```json
"menus": {
  "explorer/context": [
    { "command": "myExt.create", "group": "1_modification@1" },
    { "command": "myExt.update", "group": "1_modification@2" },
    { "command": "myExt.delete", "group": "9_cutcopypaste@1" }
  ]
}
```

- Groups sort alphabetically — `1_`, `2_`, `9_` control section order
- `@N` suffix orders items within the same group
- Built-in groups: `navigation` (always top), `1_modification`, `6_copypastecut`, `9_cutcopypaste`
- `"group": "inline"` renders as an icon button on tree item hover

## UX Do's and Don'ts

| Do | Don't |
|----|-------|
| Use `category` in commands to group in Command Palette | Flood palette with uncategorized commands |
| Confirm before destructive actions | Delete files/state silently |
| Show progress for operations > 2s | Leave users with no feedback |
| Use `when` clauses to hide irrelevant commands | Show all commands always |
| Use VSCode CSS variables in webviews | Hardcode colors — breaks themes |
| Persist settings via `contributes.configuration` | Store config in arbitrary files |
| Log details to Output Channel | Only `console.log` (invisible to users) |
| Use `context.asAbsolutePath()` for asset paths | Hardcode absolute paths |
| Use `vscode.Uri.joinPath()` for URI construction | String concatenation for paths |
