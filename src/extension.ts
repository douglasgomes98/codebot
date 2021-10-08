import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import {
  getWorkspaceFolder,
  formatToPascalCase,
  getTextByInputBox,
  getConfigurationFile,
} from './helpers';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'codebot.generateCode',
    async args => {
      try {
        const currentFolderPath = args?.fsPath;
        const workspaceFolderPath = getWorkspaceFolder();

        if (!workspaceFolderPath) {
          throw new Error('Workspace path not found!');
        }

        const folderForGeneration = currentFolderPath || workspaceFolderPath;

        if (!folderForGeneration) {
          throw new Error('Path for generation not found!');
        }

        const configurationFile = getConfigurationFile();

        const codeName = await getTextByInputBox('Enter the code name:');

        if (!codeName) {
          throw new Error('Invalid code name!');
        }

        const templateInput = await getTextByInputBox(
          'Enter the template type:',
        );

        const templateType =
          templateInput || configurationFile?.defaultTemplateType;

        if (!templateType) {
          throw new Error('Invalid template type!');
        }

        const folderForGenerationWithTemplate = path.resolve(
          folderForGeneration,
          codeName,
        );

        const templatesPath =
          configurationFile?.templateFolderPath || 'templates';

        const templateFolder = path.resolve(
          workspaceFolderPath,
          templatesPath,
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

        templates.forEach(template => {
          const templatePath = path.resolve(templateFolder, template);

          const currentTemplate = handlebars.compile(
            fs.readFileSync(templatePath, 'utf8'),
          );

          const render = currentTemplate({
            name: codeName,
          });

          const templateNameFormatted = template
            .replace(templateType, formatToPascalCase(codeName))
            .replace('.hbs', '');

          if (!fs.existsSync(folderForGenerationWithTemplate)) {
            fs.mkdirSync(folderForGenerationWithTemplate, { recursive: true });
          }

          fs.writeFileSync(
            path.resolve(
              folderForGenerationWithTemplate,
              templateNameFormatted,
            ),
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
