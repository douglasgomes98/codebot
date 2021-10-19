import * as fs from 'fs';

export function createFile(path: string, data: string) {
  fs.writeFileSync(path, data, { encoding: 'utf-8' });
}
