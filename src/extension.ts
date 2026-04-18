import * as vscode from 'vscode';
import { createComponent } from './commands/createComponent';
import { updateComponent } from './commands/updateComponent';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codebot.createComponent', args =>
      createComponent(args),
    ),
    vscode.commands.registerCommand('codebot.updateComponent', args =>
      updateComponent(args),
    ),
  );
}

export function deactivate() {}
