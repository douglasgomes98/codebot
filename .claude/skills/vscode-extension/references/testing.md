# Testing VSCode Extensions

## Two Testing Strategies

| Strategy | Tool | Use when |
|----------|------|----------|
| **Unit/integration** | Jest + vscode mock | Testing business logic, commands, managers — no extension host needed, fast |
| **E2E (extension host)** | `@vscode/test-cli` | Testing actual VSCode integration (UI, real file system, activation) |

This project uses **Jest + vscode mock** — the preferred approach for testing extension logic without spinning up VSCode.

## Jest Setup

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/__mocks__/vscode.ts'
  },
  setupFilesAfterEnach: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/test/**/*'],
  maxWorkers: 1,
  forceExit: true,
};
```

## vscode Mock Structure

```typescript
// src/test/__mocks__/vscode.ts
export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showInputBox: jest.fn(),
  showQuickPick: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn(),
  })),
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(), hide: jest.fn(), dispose: jest.fn(), text: '', tooltip: ''
  })),
  activeTextEditor: undefined,
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
  })),
  workspaceFolders: undefined,
  onDidChangeWorkspaceFolders: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
  findFiles: jest.fn(),
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    readDirectory: jest.fn(),
    createDirectory: jest.fn(),
    delete: jest.fn(),
  },
};

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn(),
};

export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path, path, scheme: 'file' })),
  parse: jest.fn(),
  joinPath: jest.fn((base: { fsPath: string }, ...parts: string[]) => ({
    fsPath: [base.fsPath, ...parts].join('/'),
  })),
};

export const ExtensionContext = jest.fn(() => ({
  subscriptions: [],
  workspaceState: { get: jest.fn(), update: jest.fn() },
  globalState: { get: jest.fn(), update: jest.fn(), setKeysForSync: jest.fn() },
  secrets: { get: jest.fn(), store: jest.fn(), delete: jest.fn() },
  extensionUri: Uri.file('/mock/extension'),
  extensionPath: '/mock/extension',
  globalStorageUri: Uri.file('/mock/storage'),
  storagePath: '/mock/storage',
  asAbsolutePath: jest.fn((rel: string) => `/mock/extension/${rel}`),
}));

export enum TreeItemCollapsibleState { None = 0, Collapsed = 1, Expanded = 2 }
export enum DiagnosticSeverity { Error = 0, Warning = 1, Information = 2, Hint = 3 }
export class TreeItem { constructor(public label: string, public collapsibleState?: TreeItemCollapsibleState) {} }
export class Range { constructor(public start: any, public end: any) {} }
export class Position { constructor(public line: number, public character: number) {} }
export class ThemeIcon { constructor(public id: string) {} }
export class ThemeColor { constructor(public id: string) {} }
export class EventEmitter<T> {
  event = jest.fn();
  fire = jest.fn();
  dispose = jest.fn();
}
```

## Writing Unit Tests

### Testing a Command Handler

```typescript
// src/test/commands/createComponent.test.ts
import { createComponent } from '../../commands/createComponent';
import * as vscode from 'vscode';

describe('createComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error when no folder path provided', async () => {
    await createComponent({});

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('No folder path')
    );
  });

  it('shows info on successful creation', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('MyComponent');
    (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({ label: 'Component' });

    await createComponent({ fsPath: '/workspace/src' });

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('MyComponent')
    );
  });

  it('returns early when user cancels input box', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);

    await createComponent({ fsPath: '/workspace/src' });

    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });
});
```

### Testing a Manager Class

```typescript
// src/test/managers/TemplateManager.test.ts
import * as fs from 'node:fs';
import { TemplateManager } from '../../managers/TemplateManager';

jest.mock('node:fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TemplateManager', () => {
  let manager: TemplateManager;

  beforeEach(() => {
    manager = new TemplateManager();
    jest.clearAllMocks();
  });

  it('returns empty array when templates folder does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = await manager.discoverTemplates('/workspace');

    expect(result).toEqual([]);
  });

  it('discovers templates from folder', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(['ComponentA', 'ComponentB'] as any);

    const result = await manager.discoverTemplates('/workspace');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('ComponentA');
  });
});
```

## Mocking ExtensionContext

```typescript
function makeContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
    workspaceState: { get: jest.fn(), update: jest.fn() },
    globalState: { get: jest.fn(), update: jest.fn(), setKeysForSync: jest.fn() },
    secrets: { get: jest.fn(), store: jest.fn(), delete: jest.fn() },
    extensionUri: vscode.Uri.file('/ext'),
    asAbsolutePath: (rel: string) => `/ext/${rel}`,
  } as unknown as vscode.ExtensionContext;
}
```

## Coverage

```bash
npm run test:coverage   # generates coverage/ folder
# Open coverage/index.html to view by file
```

Target: >80% coverage on `src/managers/` and `src/commands/`. Lower bar for `src/helpers/` (thin wrappers).

## E2E with @vscode/test-cli (when needed)

```bash
npm install --save-dev @vscode/test-cli @vscode/test-electron
```

```typescript
// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';
export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: './test-fixtures',
});
```

```bash
npx vscode-test   # runs inside actual VSCode extension host
```

Use only when testing VSCode-specific behavior (activation, real FileSystem, UI interactions) — Jest is faster for logic.
