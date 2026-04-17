// Mock do módulo vscode para testes
const vscode = {
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
        name: 'test-workspace',
        index: 0
      }
    ],
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      has: jest.fn(() => true),
      inspect: jest.fn()
    })),
    onDidChangeConfiguration: jest.fn(),
    findFiles: jest.fn(() => Promise.resolve([])),
    openTextDocument: jest.fn(),
    saveAll: jest.fn()
  },
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    }))
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path, scheme: 'file', path })),
    parse: jest.fn((uri) => ({ fsPath: uri, scheme: 'file', path: uri }))
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  ExtensionContext: jest.fn(),
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

module.exports = vscode;