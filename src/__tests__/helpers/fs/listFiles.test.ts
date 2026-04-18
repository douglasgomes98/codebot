import * as fs from 'node:fs';
import { listFiles } from '../../../helpers/fs/listFiles';

describe('listFiles', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns array of filenames on success', () => {
    jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['Button.tsx', 'index.ts', 'Button.test.tsx'] as never);

    const result = listFiles('/project/src/Button');

    expect(result).toEqual({
      success: true,
      value: ['Button.tsx', 'index.ts', 'Button.test.tsx'],
    });
    expect(fs.readdirSync).toHaveBeenCalledWith('/project/src/Button');
  });

  it('returns empty array for empty directory', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([] as never);

    const result = listFiles('/project/empty');

    expect(result).toEqual({ success: true, value: [] });
  });

  it('returns FOLDER_LIST_ERROR when directory does not exist', () => {
    jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const result = listFiles('/missing/dir');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FOLDER_LIST_ERROR');
      expect(result.error.message).toContain('/missing/dir');
    }
  });

  it('preserves the original error as cause', () => {
    const originalError = new Error('ENOENT');
    jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw originalError;
    });

    const result = listFiles('/dir');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
