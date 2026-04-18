import * as vscode from 'vscode';
import { workspaceFileExists } from '../../../../helpers/vscode/workspace/fileExists';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('workspaceFileExists', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/src/Button/Button.tsx');

  it('returns true when stat succeeds', async () => {
    mockFs.stat.mockResolvedValue({ type: 1, ctime: 0, mtime: 0, size: 100 });

    expect(await workspaceFileExists(uri)).toBe(true);
    expect(mockFs.stat).toHaveBeenCalledWith(uri);
  });

  it('returns false when stat throws (file not found)', async () => {
    mockFs.stat.mockRejectedValue(new Error('FileNotFound'));

    expect(await workspaceFileExists(uri)).toBe(false);
  });

  it('returns false for any stat error (permission denied, etc.)', async () => {
    mockFs.stat.mockRejectedValue(new Error('NoPermissions'));

    expect(await workspaceFileExists(uri)).toBe(false);
  });
});
