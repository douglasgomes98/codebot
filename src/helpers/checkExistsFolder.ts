import * as fs from 'node:fs';

export function checkExistsFolder(path: string) {
  return fs.existsSync(path);
}
