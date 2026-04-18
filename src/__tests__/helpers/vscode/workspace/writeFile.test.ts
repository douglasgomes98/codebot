import * as vscode from 'vscode';
import { writeWorkspaceFile } from '../../../../helpers/vscode/workspace/writeFile';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('writeWorkspaceFile', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/src/Button/Button.tsx');

  it('writes encoded content to the workspace URI', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);

    const result = await writeWorkspaceFile(
      uri,
      'export default function Button() {}',
    );

    expect(result).toEqual({ success: true, value: undefined });
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      uri,
      new TextEncoder().encode('export default function Button() {}'),
    );
  });

  it('returns WORKSPACE_FILE_WRITE_ERROR when write fails', async () => {
    mockFs.writeFile.mockRejectedValue(new Error('FileNotFound'));

    const result = await writeWorkspaceFile(uri, 'content');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_FILE_WRITE_ERROR');
      expect(result.error.message).toContain(uri.fsPath);
    }
  });

  it('preserves the original error as cause', async () => {
    const originalError = new Error('EACCES');
    mockFs.writeFile.mockRejectedValue(originalError);

    const result = await writeWorkspaceFile(uri, '');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });

  it('writes empty string content', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);

    const result = await writeWorkspaceFile(uri, '');

    expect(result.success).toBe(true);
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      uri,
      new TextEncoder().encode(''),
    );
  });
});
