import * as fs from 'node:fs';

export const fileExists = (filePath: string): boolean => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
