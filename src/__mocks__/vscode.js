const path = require('node:path');

const makeUri = fsPath => ({
  fsPath,
  scheme: 'file',
  path: fsPath,
  toString: () => `file://${fsPath}`,
});

const Uri = {
  file: fsPath => makeUri(fsPath),
  joinPath: (base, ...segments) => makeUri(path.join(base.fsPath, ...segments)),
};

const workspace = {
  fs: {
    readDirectory: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
    createDirectory: jest.fn(),
    writeFile: jest.fn(),
  },
  getConfiguration: jest.fn(),
  workspaceFolders: [
    {
      uri: { fsPath: '/test/workspace' },
      name: 'workspace',
      index: 0,
    },
  ],
  getWorkspaceFolder(uri) {
    const folders = workspace.workspaceFolders;
    if (!folders || folders.length === 0) return undefined;
    const sep = require('node:path').sep;
    return (
      [...folders]
        .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length)
        .find(
          f =>
            uri.fsPath === f.uri.fsPath ||
            uri.fsPath.startsWith(f.uri.fsPath + sep),
        ) ?? undefined
    );
  },
};

const window = {
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showQuickPick: jest.fn(),
  showInputBox: jest.fn(),
};

const commands = {
  registerCommand: jest.fn(),
};

module.exports = {
  Uri,
  workspace,
  window,
  commands,
};
