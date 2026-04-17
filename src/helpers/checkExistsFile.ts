import { readFile } from './readFile';

export function checkExistsFile(path: string) {
  try {
    readFile(path);
    return true;
  } catch (_error) {
    return false;
  }
}
