import * as fs from 'node:fs';

export function getFilesByFolder(path: string) {
  return fs.readdirSync(path);
}
