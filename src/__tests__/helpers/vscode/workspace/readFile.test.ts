import * as vscode from 'vscode';
import { readWorkspaceFile } from '../../../../helpers/vscode/workspace/readFile';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('readWorkspaceFile', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/src/Button/Button.tsx');

  it('returns decoded content on success', async () => {
    const content = 'export default function Button() {}';
    mockFs.readFile.mockResolvedValue(new TextEncoder().encode(content));

    const result = await readWorkspaceFile(uri);

    expect(result).toEqual({ success: true, value: content });
    expect(mockFs.readFile).toHaveBeenCalledWith(uri);
  });

  it('returns WORKSPACE_FILE_READ_ERROR when read fails', async () => {
    mockFs.readFile.mockRejectedValue(new Error('FileNotFound'));

    const result = await readWorkspaceFile(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_FILE_READ_ERROR');
      expect(result.error.message).toContain(uri.fsPath);
    }
  });

  it('preserves the original error as cause', async () => {
    const originalError = new Error('ENOENT');
    mockFs.readFile.mockRejectedValue(originalError);

    const result = await readWorkspaceFile(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });

  it('decodes UTF-8 content correctly', async () => {
    const content = 'const greeting = "Olá mundo 🌍"';
    mockFs.readFile.mockResolvedValue(new TextEncoder().encode(content));

    const result = await readWorkspaceFile(uri);

    expect(result).toEqual({ success: true, value: content });
  });
});
