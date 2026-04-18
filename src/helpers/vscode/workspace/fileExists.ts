import * as vscode from 'vscode';

export const workspaceFileExists = async (
  uri: vscode.Uri,
): Promise<boolean> => {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
};
