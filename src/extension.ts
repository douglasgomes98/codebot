import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getWorkspaceFolder } from './helpers/getWorkspaceFolder';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'codebot.generateCode',
    async args => {
      try {
        const codeName = await vscode.window.showInputBox({
          prompt: 'Enter the code name:',
          ignoreFocusOut: true,
          valueSelection: [-1, -1],
        });

        if (!codeName) {
          throw new Error('Invalid code name!');
        }

        const templateType = await vscode.window.showInputBox({
          prompt: 'Enter the template type:',
          ignoreFocusOut: true,
          valueSelection: [-1, -1],
        });

        if (!templateType) {
          throw new Error('Invalid template type!');
        }

        const currentFolderPath = args?.fsPath;
        const workspaceFolderPath = getWorkspaceFolder();

        if (!workspaceFolderPath) {
          throw new Error('Workspace path not found!');
        }

        const folderForGeneration = currentFolderPath || workspaceFolderPath;

        const folderForGenerationWithTemplate = path.resolve(
          folderForGeneration,
          codeName,
        );

        const templateFolder = path.resolve(
          workspaceFolderPath,
          'templates',
          templateType,
        );

        if (!fs.existsSync(templateFolder)) {
          throw new Error('Template folder not found!');
        }

        console.log(folderForGenerationWithTemplate);
        console.log(currentFolderPath);
        console.log(workspaceFolderPath);
        console.log(templateFolder);
        console.log(args);
        console.log(codeName);
        console.log(templateType);
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
