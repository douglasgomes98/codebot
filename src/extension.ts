import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import { getWorkspaceFolder } from './helpers/getWorkspaceFolder';
import { formatToPascalCase } from './helpers/formatToPascalCase';

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

        const templateTypeByUser = await vscode.window.showInputBox({
          prompt: 'Enter the template type:',
          ignoreFocusOut: true,
          valueSelection: [-1, -1],
        });

        const templateType = templateTypeByUser || 'Component';

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

        const templates = fs.readdirSync(templateFolder);

        if (templates.length === 0) {
          throw new Error('Template folder is empty!');
        }

        handlebars.registerHelper('pascalCase', formatToPascalCase);

        templates.forEach(file => {
          const filePath = path.resolve(templateFolder, file);

          const currentTemplate = handlebars.compile(
            fs.readFileSync(filePath, 'utf8'),
          );

          const render = currentTemplate({
            name: codeName,
          });

          const filePathFormatted = file
            .replace(templateType, formatToPascalCase(codeName))
            .replace('.hbs', '');

          if (!fs.existsSync(folderForGenerationWithTemplate)) {
            fs.mkdirSync(folderForGenerationWithTemplate, { recursive: true });
          }

          fs.writeFileSync(
            path.resolve(folderForGenerationWithTemplate, filePathFormatted),
            render,
            { encoding: 'utf-8' },
          );
        });
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
