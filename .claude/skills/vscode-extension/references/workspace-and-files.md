# Workspace & File System API

## Workspace Folders

```typescript
// Get all open folders
const folders = vscode.workspace.workspaceFolders;
if (!folders || folders.length === 0) {
  throw new Error('No workspace folder open');
}

const rootFolder = folders[0];
const rootPath = rootFolder.uri.fsPath;

// Multi-root workspace
folders.forEach(folder => {
  console.log(folder.name, folder.uri.fsPath);
});

// Listen for folder changes
context.subscriptions.push(
  vscode.workspace.onDidChangeWorkspaceFolders(e => {
    e.added.forEach(f => console.log('Added:', f.uri.fsPath));
    e.removed.forEach(f => console.log('Removed:', f.uri.fsPath));
  })
);
```

## Uri Construction (always use these — never string concat)

```typescript
// From absolute path
const uri = vscode.Uri.file('/absolute/path/to/file.ts');

// Join segments safely
const child = vscode.Uri.joinPath(rootFolder.uri, 'src', 'components', 'index.ts');

// Parse from string (use for non-file URIs)
const untitled = vscode.Uri.parse('untitled:NewFile.ts');

// Get fsPath (cross-platform absolute path string)
console.log(child.fsPath); // /workspace/src/components/index.ts
```

## vscode.workspace.fs (Async, Platform-Safe)

Prefer `vscode.workspace.fs` over `node:fs` when working with workspace resources — it handles remote workspaces (SSH, WSL, containers) correctly.

```typescript
// Read file
const bytes = await vscode.workspace.fs.readFile(uri);
const content = Buffer.from(bytes).toString('utf8');

// Write file
const encoder = new TextEncoder();
await vscode.workspace.fs.writeFile(uri, encoder.encode('file content'));

// Check existence
try {
  await vscode.workspace.fs.stat(uri);
  // file exists
} catch {
  // file does not exist (throws FileNotFound)
}

// Create directory (recursive)
await vscode.workspace.fs.createDirectory(uri);

// List directory
const entries = await vscode.workspace.fs.readDirectory(dirUri);
// entries: Array<[name: string, type: FileType]>
entries.forEach(([name, type]) => {
  if (type === vscode.FileType.Directory) { /* folder */ }
  if (type === vscode.FileType.File) { /* file */ }
});

// Delete (recursive for folders)
await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });

// Copy / rename
await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: false });
await vscode.workspace.fs.rename(oldUri, newUri, { overwrite: false });
```

## Find Files in Workspace

```typescript
// Glob search across workspace
const files = await vscode.workspace.findFiles(
  '**/*.hbs',          // include pattern
  '**/node_modules/**' // exclude pattern
);
// files: vscode.Uri[]

// With token to cancel long searches
const token = new vscode.CancellationTokenSource();
const results = await vscode.workspace.findFiles('**/*.ts', undefined, 100, token.token);
```

## File System Watcher

```typescript
const watcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(rootFolder, 'templates/**/*.hbs')
);

watcher.onDidCreate(uri => { /* new template added */ });
watcher.onDidChange(uri => { /* template modified — invalidate cache */ });
watcher.onDidDelete(uri => { /* template removed */ });

context.subscriptions.push(watcher);
```

## Opening & Showing Files

```typescript
// Open in editor
const doc = await vscode.workspace.openTextDocument(uri);
await vscode.window.showTextDocument(doc);

// Open with specific options
await vscode.window.showTextDocument(doc, {
  viewColumn: vscode.ViewColumn.Beside, // open to the right
  preview: false,                       // pin the tab
  selection: new vscode.Range(0, 0, 0, 0)
});

// Open external URL / file
await vscode.env.openExternal(vscode.Uri.parse('https://example.com'));
```

## Text Document Events

```typescript
context.subscriptions.push(
  vscode.workspace.onDidOpenTextDocument(doc => {
    if (doc.languageId === 'handlebars') { /* ... */ }
  }),
  vscode.workspace.onDidSaveTextDocument(doc => {
    if (doc.fileName.endsWith('.hbs')) invalidateCache();
  }),
  vscode.workspace.onDidChangeTextDocument(e => {
    const changes = e.contentChanges;
    // e.document is the changed document
  })
);
```

## Configuration

```typescript
// Read (resource-scoped — respects folder overrides in multi-root)
const config = vscode.workspace.getConfiguration('myExt', folderUri);
const templatePath = config.get<string>('templatePath', 'templates');

// Write (target: Global, Workspace, or WorkspaceFolder)
await config.update('templatePath', 'custom/templates', vscode.ConfigurationTarget.Workspace);

// Listen for changes
context.subscriptions.push(
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('myExt')) {
      reloadConfig();
    }
  })
);
```

## node:fs vs vscode.workspace.fs

| | `node:fs` | `vscode.workspace.fs` |
|---|---|---|
| Remote workspaces (SSH/WSL) | No | Yes |
| Untitled/virtual URIs | No | Yes |
| Speed (local) | Faster | Slightly slower |
| Use when | Bundler scripts, CLI tools, tests | Extension runtime code |

For extension runtime code that touches workspace files, always prefer `vscode.workspace.fs`.

## Path Utilities

```typescript
import * as path from 'node:path';

// Build paths for local (non-workspace) use
const templatesDir = path.join(context.extensionPath, 'templates');

// For workspace resources, use Uri.joinPath instead:
const templatesUri = vscode.Uri.joinPath(context.extensionUri, 'templates');

// Get extension's absolute path to a bundled asset
const iconPath = context.asAbsolutePath('assets/icon.png');
```
