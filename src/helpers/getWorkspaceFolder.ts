import * as vscode from 'vscode';

export function getWorkspaceFolder() {
  return (
    vscode?.workspace?.workspaceFolders &&
    vscode?.workspace?.workspaceFolders[0]?.uri?.fsPath
  );
}
