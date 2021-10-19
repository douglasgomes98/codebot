import * as vscode from 'vscode';

export function showMessage(message: string, type: 'information' | 'error') {
  if (type === 'information') {
    vscode.window.showInformationMessage(message);
  }

  if (type === 'error') {
    vscode.window.showErrorMessage(message);
  }
}
