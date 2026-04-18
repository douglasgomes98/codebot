import * as vscode from 'vscode';

export const showError = (message: string): void => {
  vscode.window.showErrorMessage(message);
};
