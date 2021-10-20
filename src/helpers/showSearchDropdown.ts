import * as vscode from 'vscode';

export async function showSearchDropdown(
  options: string[],
  title: string,
  placeholder: string,
) {
  return vscode.window.showQuickPick(options, {
    title,
    canPickMany: false,
    placeHolder: placeholder,
  });
}
