import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'codebot.generateCode',
    async args => {
      const codeName = await vscode.window.showInputBox({
        prompt: 'Enter the code name:',
        ignoreFocusOut: true,
        valueSelection: [-1, -1],
      });

      console.log(args);
      console.log(codeName);
      console.log(__dirname);
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
