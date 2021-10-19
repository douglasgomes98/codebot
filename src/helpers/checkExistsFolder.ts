import * as fs from 'fs';

export function checkExistsFolder(path: string) {
  return fs.existsSync(path);
}
