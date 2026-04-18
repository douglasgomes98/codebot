import * as fs from 'node:fs';
import * as path from 'node:path';
import { createFile } from '../../../helpers/fs/createFile';

describe('createFile', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creates parent directories and writes the file', () => {
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);

    const result = createFile(
      '/project/src/Button/Button.tsx',
      'export default function Button() {}',
    );

    expect(result).toEqual({ success: true, value: undefined });
    expect(mkdirSpy).toHaveBeenCalledWith(
      path.dirname('/project/src/Button/Button.tsx'),
      {
        recursive: true,
      },
    );
    expect(writeSpy).toHaveBeenCalledWith(
      '/project/src/Button/Button.tsx',
      'export default function Button() {}',
      'utf-8',
    );
  });

  it('returns FILE_WRITE_ERROR when writeFileSync throws', () => {
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = createFile('/locked/file.ts', 'content');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FILE_WRITE_ERROR');
      expect(result.error.message).toContain('/locked/file.ts');
    }
  });

  it('returns FILE_WRITE_ERROR when mkdirSync throws', () => {
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw new Error('Read-only filesystem');
    });

    const result = createFile('/readonly/dir/file.ts', 'content');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FILE_WRITE_ERROR');
    }
  });

  it('preserves the original error as cause', () => {
    const originalError = new Error('EACCES');
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw originalError;
    });

    const result = createFile('/file.ts', '');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
