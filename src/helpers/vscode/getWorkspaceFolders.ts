import * as vscode from 'vscode';
import type { Option } from '../../types/Option';

export type WorkspaceFolder = {
  readonly name: string;
  readonly path: string;
  readonly index: number;
};

export const getWorkspaceFolders = (): Option<readonly WorkspaceFolder[]> => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return folders.map(folder => ({
    name: folder.name,
    path: folder.uri.fsPath,
    index: folder.index,
  }));
};
