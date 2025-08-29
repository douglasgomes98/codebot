import * as path from 'path';
import { readFile } from './readFile';
import { ConfigurationFile } from '../types';
import { getWorkspaceFolder } from './getWorkspaceFolder';

export function getConfigurationFile(projectPath?: string): ConfigurationFile | null {
  try {
    const workspaceFolderPath = getWorkspaceFolder();
    const targetPath = projectPath || workspaceFolderPath;

    if (targetPath) {
      const file = readFile(
        path.resolve(targetPath, 'codebot.config.json'),
      );

      const configurationFile = JSON.parse(file);
      return configurationFile;
    }

    return null;
  } catch (error) {
    return null;
  }
}
