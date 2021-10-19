import * as path from 'path';

import {
  getWorkspaceFolder,
  getTextByInputBox,
  getConfigurationFile,
  checkExistsFolder,
  getFilesByFolder,
  buildTemplate,
  formatTemplateName,
  createFolder,
  createFile,
  showMessage,
  filterTemplatesFiles,
  checkExistsFile,
} from '../helpers';

export async function createComponent(args: any) {
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

    const componentName = await getTextByInputBox('Enter the component name:');

    if (!componentName) {
      throw new Error('Invalid component name!');
    }

    const templateInput = await getTextByInputBox('Enter the template type:');

    const templateType =
      templateInput || configurationFile?.defaultTemplateType;

    if (!templateType) {
      throw new Error('Invalid template type!');
    }

    const folderForGenerationWithTemplate = path.resolve(
      folderForGeneration,
      componentName,
    );

    const templatesPath = configurationFile?.templateFolderPath || 'templates';

    const templateFolder = path.resolve(
      workspaceFolderPath,
      templatesPath,
      templateType,
    );

    if (!checkExistsFolder(templateFolder)) {
      throw new Error('Template folder not found!');
    }

    const templates = filterTemplatesFiles(getFilesByFolder(templateFolder));

    if (templates.length === 0) {
      throw new Error('Template folder is empty!');
    }

    templates.forEach(template => {
      const templateNameFormatted = formatTemplateName(
        template,
        templateType,
        componentName,
      );

      if (
        checkExistsFile(
          path.resolve(folderForGenerationWithTemplate, templateNameFormatted),
        )
      ) {
        return;
      }

      const templatePath = path.resolve(templateFolder, template);

      const render = buildTemplate(templatePath, componentName);

      if (!checkExistsFolder(folderForGenerationWithTemplate)) {
        createFolder(folderForGenerationWithTemplate);
      }

      createFile(
        path.resolve(folderForGenerationWithTemplate, templateNameFormatted),
        render,
      );
    });

    showMessage('Component created!', 'information');
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, 'error');
    }
  }
}
