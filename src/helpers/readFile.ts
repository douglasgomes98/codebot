import * as fs from 'node:fs';

export function readFile(path: string) {
  return fs.readFileSync(path, 'utf8');
}
