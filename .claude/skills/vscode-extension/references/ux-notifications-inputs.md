# UX: Notifications, Inputs & Basic UI

## Core Principle

Extensions must feel native to VSCode. Use established VSCode UI components instead of custom solutions whenever possible.

## VSCode UI Architecture

```
Activity Bar  →  Sidebar (Primary/Secondary)  →  Editor Area
                                                    ↓
                                              Panel (Terminal, Output, Problems)
Status Bar (always visible across all areas)
```

## Notification Hierarchy

Use the right level — over-notification trains users to ignore messages.

```typescript
// Informational — temporary, non-blocking
vscode.window.showInformationMessage('Component created!');

// Warning — requires attention
vscode.window.showWarningMessage('Template folder is empty.');

// Error — action failed
vscode.window.showErrorMessage('Failed to read config file.');

// With actions (buttons)
const choice = await vscode.window.showInformationMessage(
  'Config not found. Create one?',
  'Yes', 'No'
);
if (choice === 'Yes') { /* ... */ }
```

**Rule:** Use Output Channel for logs and diagnostics, not `showInformationMessage`.

## Quick Pick

```typescript
// Simple list
const selected = await vscode.window.showQuickPick(
  ['Option A', 'Option B', 'Option C'],
  { placeHolder: 'Select an option', title: 'My Extension' }
);

// Rich items with descriptions
const items: vscode.QuickPickItem[] = [
  { label: '$(file) Component', description: 'React component', detail: 'Creates index.tsx + styles' },
  { label: '$(folder) Page',    description: 'Next.js page' }
];
const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select template' });

// Multiple selection
const multi = await vscode.window.showQuickPick(items, {
  canPickMany: true,
  placeHolder: 'Select files to include'
});
```

## Advanced QuickPick (dynamic filtering + buttons)

```typescript
const qp = vscode.window.createQuickPick<vscode.QuickPickItem>();
qp.title = 'Select Template';
qp.placeholder = 'Type to filter...';
qp.matchOnDescription = true;
qp.buttons = [vscode.QuickInputButtons.Back];

qp.onDidChangeValue(value => {
  qp.items = getFilteredItems(value); // dynamic filtering
});
qp.onDidAccept(() => {
  const selected = qp.selectedItems[0];
  qp.hide();
  handleSelection(selected);
});
qp.onDidTriggerButton(btn => {
  if (btn === vscode.QuickInputButtons.Back) qp.hide();
});

qp.show();
context.subscriptions.push(qp); // always dispose
```

## Input Box

```typescript
const name = await vscode.window.showInputBox({
  title: 'Component Name',
  placeHolder: 'e.g. UserProfile',
  prompt: 'Enter the component name in PascalCase',
  validateInput: value => {
    if (!value || value.trim().length === 0) return 'Name cannot be empty';
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) return 'Must be PascalCase (e.g. MyComponent)';
    return null; // valid
  }
});
if (!name) return; // user cancelled
```

## Progress Reporting

```typescript
// Notification-area spinner
await vscode.window.withProgress(
  {
    location: vscode.ProgressLocation.Notification,
    title: 'Generating component...',
    cancellable: false
  },
  async (progress) => {
    progress.report({ increment: 0, message: 'Scanning templates...' });
    // ... work ...
    progress.report({ increment: 50, message: 'Writing files...' });
    progress.report({ increment: 100 });
  }
);

// Window-level (spinner in status bar area)
vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Loading...' }, task);
```

## Output Channel

```typescript
// Create once, reuse across the extension lifetime
const output = vscode.window.createOutputChannel('My Extension');
context.subscriptions.push(output);

output.appendLine('[INFO] Extension activated');
output.appendLine(`[ERROR] ${error.message}`);
output.show(); // reveal the Output panel
```

## Status Bar Item

```typescript
const statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100  // priority: higher = more to the left within alignment
);
statusBar.text = '$(check) Ready';
statusBar.tooltip = 'My Extension is active';
statusBar.command = 'myExt.showDetails';
statusBar.show();
context.subscriptions.push(statusBar);
```

## File & Folder Dialogs

```typescript
// Open file picker
const uris = await vscode.window.showOpenDialog({
  canSelectFiles: true,
  canSelectFolders: false,
  canSelectMany: false,
  filters: { 'Templates': ['hbs', 'mustache'] }
});

// Save file picker
const saveUri = await vscode.window.showSaveDialog({
  defaultUri: vscode.Uri.file('/default/path/file.json'),
  filters: { 'JSON': ['json'] }
});
```

## Codicons

Use VSCode's built-in icon font for command icons and UI:

```
$(add)        plus sign         $(refresh)    refresh arrows
$(trash)      delete            $(file)       file
$(folder)     folder            $(gear)       settings
$(check)      checkmark         $(warning)    warning triangle
$(error)      error circle      $(info)       info circle
$(search)     magnifier         $(edit)       pencil
$(close)      X                 $(chevron-right) arrow right
$(copy)       copy              $(terminal)   terminal
$(run)        play button       $(stop)       stop square
```

Full list: https://code.visualstudio.com/api/references/icons-in-labels
