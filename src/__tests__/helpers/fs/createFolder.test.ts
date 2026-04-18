import * as fs from 'node:fs';
import { createFolder } from '../../../helpers/fs/createFolder';

describe('createFolder', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creates folder with recursive option', () => {
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

    const result = createFolder('/project/src/components/Button');

    expect(result).toEqual({ success: true, value: undefined });
    expect(mkdirSpy).toHaveBeenCalledWith('/project/src/components/Button', {
      recursive: true,
    });
  });

  it('returns FOLDER_CREATE_ERROR when mkdirSync throws', () => {
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const result = createFolder('/readonly/dir');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FOLDER_CREATE_ERROR');
      expect(result.error.message).toContain('/readonly/dir');
    }
  });

  it('preserves the original error as cause', () => {
    const originalError = new Error('EACCES');
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw originalError;
    });

    const result = createFolder('/dir');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
