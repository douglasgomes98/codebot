import * as path from 'node:path';
import type { ConfigurationFile } from '../types';
import { getWorkspaceFolder } from './getWorkspaceFolder';
import { readFile } from './readFile';

export function getConfigurationFile(
  projectPath?: string,
): ConfigurationFile | null {
  try {
    const workspaceFolderPath = getWorkspaceFolder();
    const targetPath = projectPath || workspaceFolderPath;

    if (targetPath) {
      const file = readFile(path.resolve(targetPath, 'codebot.config.json'));

      const configurationFile = JSON.parse(file);
      return configurationFile;
    }

    return null;
  } catch (_error) {
    return null;
  }
}
