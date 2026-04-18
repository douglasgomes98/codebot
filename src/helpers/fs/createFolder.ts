import * as fs from 'node:fs';
import { type AppError, makeError } from '../../types/AppError';
import { err, ok, type Result } from '../../types/Result';

export const createFolder = (folderPath: string): Result<void, AppError> => {
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    return ok(undefined);
  } catch (cause) {
    return err(
      makeError(
        'FOLDER_CREATE_ERROR',
        `Failed to create folder: ${folderPath}`,
        cause,
      ),
    );
  }
};
