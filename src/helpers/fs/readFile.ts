import * as fs from 'node:fs';
import { type AppError, makeError } from '../../types/AppError';
import { err, ok, type Result } from '../../types/Result';

export const readFile = (filePath: string): Result<string, AppError> => {
  try {
    return ok(fs.readFileSync(filePath, 'utf-8'));
  } catch (cause) {
    return err(
      makeError('FILE_READ_ERROR', `Failed to read file: ${filePath}`, cause),
    );
  }
};
