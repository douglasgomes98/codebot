import * as path from 'node:path';
import * as vscode from 'vscode';
import { getNameFormat, readConfig } from '../helpers/config/readConfig';
import { listTemplates } from '../helpers/template/listTemplates';
import { processTemplateFolder } from '../helpers/template/processTemplateFolder';
import { getWorkspaceFolders } from '../helpers/vscode/getWorkspaceFolders';
import { promptInput } from '../helpers/vscode/promptInput';
import { promptSelection } from '../helpers/vscode/promptSelection';
import { showError } from '../helpers/vscode/showError';
import { showInfo } from '../helpers/vscode/showInfo';
import { createWorkspaceFolder } from '../helpers/vscode/workspace/createFolder';
import { workspaceFileExists } from '../helpers/vscode/workspace/fileExists';
import { writeWorkspaceFile } from '../helpers/vscode/workspace/writeFile';
import { formatName } from '../utils/formatName';
import { COMPONENT_NAME_ERROR, canBeFormatted } from '../utils/validation';

const findWorkspaceFolderUri = (
  clickedUri: vscode.Uri,
): vscode.Uri | undefined => {
  const folders = getWorkspaceFolders();
  if (!folders) return undefined;
  const match = folders.find(f => clickedUri.fsPath.startsWith(f.path));
  return match ? vscode.Uri.file(match.path) : undefined;
};

export const createComponent = async (
  clickedUri?: vscode.Uri,
): Promise<void> => {
  if (!clickedUri) {
    showError('Right-click a folder in the Explorer to build a template.');
    return;
  }

  const workspaceFolderUri = findWorkspaceFolderUri(clickedUri);
  if (!workspaceFolderUri) {
    showError(
      'Could not determine the workspace folder for the selected path.',
    );
    return;
  }

  const config = readConfig(clickedUri);
  const templatesUri = vscode.Uri.joinPath(
    workspaceFolderUri,
    config.templatesFolderPath,
  );

  const templatesResult = await listTemplates(templatesUri);
  if (!templatesResult.success) {
    showError(
      `Could not read templates folder '${config.templatesFolderPath}'.`,
    );
    return;
  }

  if (templatesResult.value.length === 0) {
    showError(`No templates found in '${config.templatesFolderPath}'.`);
    return;
  }

  const rawName = await promptInput({
    prompt: 'Component name',
    placeholder: 'e.g. Button',
    validateInput: v => (canBeFormatted(v) ? undefined : COMPONENT_NAME_ERROR),
  });
  if (!rawName) return;

  let templateName: string | undefined;
  if (templatesResult.value.length === 1) {
    templateName = templatesResult.value[0];
  } else {
    templateName = await promptSelection(templatesResult.value, {
      placeholder: 'Select a template',
    });
  }
  if (!templateName) return;

  const componentName = formatName(
    rawName.trim(),
    getNameFormat(config, templateName),
  );
  const templateFolderUri = vscode.Uri.joinPath(templatesUri, templateName);

  const processedResult = await processTemplateFolder(
    templateFolderUri,
    templateName,
    componentName,
  );
  if (!processedResult.success) {
    showError(`Failed to process template: ${processedResult.error.message}`);
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const file of processedResult.value) {
    const fileUri = vscode.Uri.joinPath(
      clickedUri,
      componentName,
      file.targetRelativePath,
    );

    if (await workspaceFileExists(fileUri)) {
      skipped++;
      continue;
    }

    const parentUri = vscode.Uri.file(path.dirname(fileUri.fsPath));
    const folderResult = await createWorkspaceFolder(parentUri);
    if (!folderResult.success) {
      showError(
        `Failed to create folder for '${file.targetRelativePath}': ${folderResult.error.message}`,
      );
      return;
    }

    const writeResult = await writeWorkspaceFile(fileUri, file.content);
    if (!writeResult.success) {
      showError(
        `Failed to write '${file.targetRelativePath}': ${writeResult.error.message}`,
      );
      return;
    }

    created++;
  }

  const msg =
    skipped > 0
      ? `'${componentName}' created — ${created} file(s) written, ${skipped} skipped`
      : `'${componentName}' created — ${created} file(s) written`;

  showInfo(msg);
};
