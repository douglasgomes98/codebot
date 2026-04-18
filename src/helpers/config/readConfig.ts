import * as vscode from 'vscode';
import {
  CONFIG_KEY_TEMPLATES_FOLDER,
  CONFIG_SECTION,
  type CodebotConfig,
  DEFAULT_TEMPLATES_FOLDER,
} from '../../types/Config';

export const readConfig = (scope?: vscode.Uri): CodebotConfig => {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION, scope);
  return {
    templatesFolderPath:
      config.get<string>(CONFIG_KEY_TEMPLATES_FOLDER) ??
      DEFAULT_TEMPLATES_FOLDER,
  };
};
