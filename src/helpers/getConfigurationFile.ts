import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationFile } from '../types';
import { getWorkspaceFolder } from './getWorkspaceFolder';

export function getConfigurationFile(): ConfigurationFile | null {
  const workspaceFolderPath = getWorkspaceFolder();

  if (workspaceFolderPath) {
    const file = fs.readFileSync(
      path.resolve(workspaceFolderPath, 'codebot.config.json'),
      'utf-8',
    );

    const configurationFile = JSON.parse(file);
    return configurationFile;
  }

  return null;
}
