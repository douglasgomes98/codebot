import * as vscode from 'vscode';

export const showInfo = (message: string): void => {
  vscode.window.showInformationMessage(message);
};
