import * as vscode from 'vscode';
import { createComponent, updateComponent } from './commands';

export function activate(context: vscode.ExtensionContext) {
  const disposable = [
    vscode.commands.registerCommand('codebot.createComponent', args =>
      createComponent(args),
    ),
    vscode.commands.registerCommand('codebot.updateComponent', args =>
      updateComponent(args),
    ),
  ];

  context.subscriptions.push(...disposable);
}

export function deactivate() {}
