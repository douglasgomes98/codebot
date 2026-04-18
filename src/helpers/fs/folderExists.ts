import * as fs from 'node:fs';

export const folderExists = (folderPath: string): boolean => {
  try {
    return fs.statSync(folderPath).isDirectory();
  } catch {
    return false;
  }
};
