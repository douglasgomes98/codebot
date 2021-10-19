import * as fs from 'fs';

export function createFolder(path: string) {
  fs.mkdirSync(path, { recursive: true });
}
