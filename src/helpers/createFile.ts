import * as fs from 'node:fs';

export function createFile(path: string, data: string) {
  fs.writeFileSync(path, data, { encoding: 'utf-8' });
}
