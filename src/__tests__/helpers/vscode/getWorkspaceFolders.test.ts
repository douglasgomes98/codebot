import * as vscode from 'vscode';
import { getWorkspaceFolders } from '../../../helpers/vscode/getWorkspaceFolders';

describe('getWorkspaceFolders', () => {
  const originalFolders = vscode.workspace.workspaceFolders;

  afterEach(() => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalFolders,
      writable: true,
    });
  });

  it('returns mapped workspace folders when folders exist', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [
        { uri: { fsPath: '/project/root' }, name: 'root', index: 0 },
        { uri: { fsPath: '/project/packages/app' }, name: 'app', index: 1 },
      ],
      writable: true,
    });

    const result = getWorkspaceFolders();

    expect(result).toEqual([
      { name: 'root', path: '/project/root', index: 0 },
      { name: 'app', path: '/project/packages/app', index: 1 },
    ]);
  });

  it('returns undefined when workspaceFolders is undefined', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: undefined,
      writable: true,
    });

    expect(getWorkspaceFolders()).toBeUndefined();
  });

  it('returns undefined when workspaceFolders is empty array', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [],
      writable: true,
    });

    expect(getWorkspaceFolders()).toBeUndefined();
  });

  it('maps fsPath to path field', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [{ uri: { fsPath: '/my/project' }, name: 'project', index: 0 }],
      writable: true,
    });

    const result = getWorkspaceFolders();

    expect(result?.[0].path).toBe('/my/project');
  });
});
