import * as vscode from 'vscode';
import { createComponent } from './commands/createComponent';

export function activate(context: vscode.ExtensionContext) {
  const disposable = [
    vscode.commands.registerCommand('codebot.createComponent', args =>
      createComponent(args),
    ),
  ];

  context.subscriptions.push(...disposable);
}

export function deactivate() {}
