import * as fs from 'node:fs';
import { folderExists } from '../../../helpers/fs/folderExists';

describe('folderExists', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns true when path is a directory', () => {
    jest
      .spyOn(fs, 'statSync')
      .mockReturnValue({ isDirectory: () => true } as fs.Stats);

    expect(folderExists('/project/src')).toBe(true);
  });

  it('returns false when path is a file, not a directory', () => {
    jest
      .spyOn(fs, 'statSync')
      .mockReturnValue({ isDirectory: () => false } as fs.Stats);

    expect(folderExists('/project/file.ts')).toBe(false);
  });

  it('returns false when path does not exist', () => {
    jest.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(folderExists('/missing/dir')).toBe(false);
  });
});
