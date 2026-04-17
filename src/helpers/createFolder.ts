import * as fs from 'node:fs';

export function createFolder(path: string) {
  fs.mkdirSync(path, { recursive: true });
}
