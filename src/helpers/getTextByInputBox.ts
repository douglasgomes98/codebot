import * as vscode from 'vscode';

export async function getTextByInputBox(label: string) {
  return vscode.window.showInputBox({
    prompt: label,
    ignoreFocusOut: true,
    valueSelection: [-1, -1],
  });
}
