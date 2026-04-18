import * as fs from 'node:fs';
import { fileExists } from '../../../helpers/fs/fileExists';

describe('fileExists', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns true when file is accessible', () => {
    jest.spyOn(fs, 'accessSync').mockReturnValue(undefined);

    expect(fileExists('/project/file.ts')).toBe(true);
    expect(fs.accessSync).toHaveBeenCalledWith(
      '/project/file.ts',
      fs.constants.F_OK,
    );
  });

  it('returns false when file does not exist', () => {
    jest.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(fileExists('/missing/file.ts')).toBe(false);
  });

  it('returns false when access is denied', () => {
    jest.spyOn(fs, 'accessSync').mockImplementation(() => {
      throw new Error('EACCES');
    });

    expect(fileExists('/protected/file.ts')).toBe(false);
  });
});
