import * as fs from 'node:fs';
import { readFile } from '../../../helpers/fs/readFile';

describe('readFile', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns file content on success', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('file content' as never);

    const result = readFile('/project/file.ts');

    expect(result).toEqual({ success: true, value: 'file content' });
    expect(fs.readFileSync).toHaveBeenCalledWith('/project/file.ts', 'utf-8');
  });

  it('returns FILE_READ_ERROR when file does not exist', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const result = readFile('/missing/file.ts');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FILE_READ_ERROR');
      expect(result.error.message).toContain('/missing/file.ts');
    }
  });

  it('preserves the original error as cause', () => {
    const originalError = new Error('ENOENT');
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw originalError;
    });

    const result = readFile('/file.ts');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
