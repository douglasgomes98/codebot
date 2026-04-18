import * as fs from 'node:fs';
import { type AppError, makeError } from '../../types/AppError';
import { err, ok, type Result } from '../../types/Result';

export const listFiles = (folderPath: string): Result<string[], AppError> => {
  try {
    return ok(fs.readdirSync(folderPath));
  } catch (cause) {
    return err(
      makeError(
        'FOLDER_LIST_ERROR',
        `Failed to list files in: ${folderPath}`,
        cause,
      ),
    );
  }
};
