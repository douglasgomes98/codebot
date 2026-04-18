import * as fs from 'node:fs';
import * as path from 'node:path';
import { type AppError, makeError } from '../../types/AppError';
import { err, ok, type Result } from '../../types/Result';

export const createFile = (
  filePath: string,
  content: string,
): Result<void, AppError> => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return ok(undefined);
  } catch (cause) {
    return err(
      makeError(
        'FILE_WRITE_ERROR',
        `Failed to create file: ${filePath}`,
        cause,
      ),
    );
  }
};
