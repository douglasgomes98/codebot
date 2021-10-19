import * as path from 'path';
import { readFile } from './readFile';
import { ConfigurationFile } from '../types';
import { getWorkspaceFolder } from './getWorkspaceFolder';

export function getConfigurationFile(): ConfigurationFile | null {
  try {
    const workspaceFolderPath = getWorkspaceFolder();

    if (workspaceFolderPath) {
      const file = readFile(
        path.resolve(workspaceFolderPath, 'codebot.config.json'),
      );

      const configurationFile = JSON.parse(file);
      return configurationFile;
    }

    return null;
  } catch (error) {
    return null;
  }
}
