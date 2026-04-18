import * as vscode from 'vscode';
import {
  CONFIG_KEY_TEMPLATE_SETTINGS,
  CONFIG_KEY_TEMPLATES_FOLDER,
  CONFIG_SECTION,
  type CodebotConfig,
  DEFAULT_NAME_FORMAT,
  DEFAULT_TEMPLATES_FOLDER,
  type NameFormat,
  type TemplateSettings,
} from '../../types/Config';

export const readConfig = (scope?: vscode.Uri): CodebotConfig => {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION, scope);
  return {
    templatesFolderPath:
      config.get<string>(CONFIG_KEY_TEMPLATES_FOLDER) ??
      DEFAULT_TEMPLATES_FOLDER,
    templateSettings:
      config.get<Record<string, TemplateSettings>>(
        CONFIG_KEY_TEMPLATE_SETTINGS,
      ) ?? {},
  };
};

export const getNameFormat = (
  config: CodebotConfig,
  templateName: string,
): NameFormat =>
  config.templateSettings[templateName]?.nameFormat ?? DEFAULT_NAME_FORMAT;
