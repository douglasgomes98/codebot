import * as vscode from 'vscode';
import { createWorkspaceFolder } from '../../../../helpers/vscode/workspace/createFolder';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('createWorkspaceFolder', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/src/Button');

  it('calls createDirectory with the given URI', async () => {
    mockFs.createDirectory.mockResolvedValue(undefined);

    const result = await createWorkspaceFolder(uri);

    expect(result).toEqual({ success: true, value: undefined });
    expect(mockFs.createDirectory).toHaveBeenCalledWith(uri);
  });

  it('returns WORKSPACE_FOLDER_CREATE_ERROR when creation fails', async () => {
    mockFs.createDirectory.mockRejectedValue(new Error('NoPermissions'));

    const result = await createWorkspaceFolder(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_FOLDER_CREATE_ERROR');
      expect(result.error.message).toContain(uri.fsPath);
    }
  });

  it('preserves the original error as cause', async () => {
    const originalError = new Error('NoPermissions');
    mockFs.createDirectory.mockRejectedValue(originalError);

    const result = await createWorkspaceFolder(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
