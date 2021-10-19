import * as fs from 'fs';

export function getFilesByFolder(path: string) {
  return fs.readdirSync(path);
}
