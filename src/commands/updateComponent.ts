import * as path from 'node:path';
import * as vscode from 'vscode';
import { readConfig } from '../helpers/config/readConfig';
import { listTemplates } from '../helpers/template/listTemplates';
import { processTemplateFolder } from '../helpers/template/processTemplateFolder';
import { getWorkspaceFolders } from '../helpers/vscode/getWorkspaceFolders';
import { promptSelection } from '../helpers/vscode/promptSelection';
import { showError } from '../helpers/vscode/showError';
import { showInfo } from '../helpers/vscode/showInfo';
import { createWorkspaceFolder } from '../helpers/vscode/workspace/createFolder';
import { workspaceFileExists } from '../helpers/vscode/workspace/fileExists';
import { writeWorkspaceFile } from '../helpers/vscode/workspace/writeFile';
import { formatToPascalCase, isValidComponentName } from '../utils/validation';

const findWorkspaceFolderUri = (
  clickedUri: vscode.Uri,
): vscode.Uri | undefined => {
  const folders = getWorkspaceFolders();
  if (!folders) return undefined;
  const match = folders.find(f => clickedUri.fsPath.startsWith(f.path));
  return match ? vscode.Uri.file(match.path) : undefined;
};

export const updateComponent = async (
  clickedUri?: vscode.Uri,
): Promise<void> => {
  if (!clickedUri) {
    showError('Right-click a component folder in the Explorer to update it.');
    return;
  }

  const rawName = path.basename(clickedUri.fsPath);
  const componentName = formatToPascalCase(rawName);
  if (!isValidComponentName(componentName)) {
    showError(
      `'${rawName}' cannot be converted to a valid component name. Right-click directly on the component folder.`,
    );
    return;
  }

  const workspaceFolderUri = findWorkspaceFolderUri(clickedUri);
  if (!workspaceFolderUri) {
    showError(
      'Could not determine the workspace folder for the selected path.',
    );
    return;
  }

  const config = readConfig(workspaceFolderUri);
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

  let templateName: string | undefined;
  if (templatesResult.value.length === 1) {
    templateName = templatesResult.value[0];
  } else {
    templateName = await promptSelection(templatesResult.value, {
      placeholder: 'Select a template',
    });
  }
  if (!templateName) return;

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
    const fileUri = vscode.Uri.joinPath(clickedUri, file.targetRelativePath);

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

  if (created === 0 && skipped > 0) {
    showInfo(
      `'${componentName}' is already up to date — all ${skipped} file(s) exist.`,
    );
    return;
  }

  const msg =
    skipped > 0
      ? `'${componentName}' updated — ${created} file(s) added, ${skipped} skipped`
      : `'${componentName}' updated — ${created} file(s) added`;

  showInfo(msg);
};
