import * as vscode from 'vscode';
import { listWorkspaceEntries } from '../../../../helpers/vscode/workspace/listEntries';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('listWorkspaceEntries', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/templates/ComponentSass');

  it('returns mapped entries with correct types', async () => {
    mockFs.readDirectory.mockResolvedValue([
      ['ComponentSass.tsx.hbs', 1], // File
      ['ComponentSass.spec.tsx.hbs', 1], // File
      ['index.tsx.hbs', 1], // File
      ['__snapshots__', 2], // Directory
    ] as never);

    const result = await listWorkspaceEntries(uri);

    expect(result).toEqual({
      success: true,
      value: [
        { name: 'ComponentSass.tsx.hbs', type: 'file' },
        { name: 'ComponentSass.spec.tsx.hbs', type: 'file' },
        { name: 'index.tsx.hbs', type: 'file' },
        { name: '__snapshots__', type: 'directory' },
      ],
    });
  });

  it('maps unknown FileType values to "other"', async () => {
    mockFs.readDirectory.mockResolvedValue([
      ['symlink', 64], // SymbolicLink
      ['unknown', 0], // Unknown
    ] as never);

    const result = await listWorkspaceEntries(uri);

    expect(result).toEqual({
      success: true,
      value: [
        { name: 'symlink', type: 'other' },
        { name: 'unknown', type: 'other' },
      ],
    });
  });

  it('returns empty array for empty directory', async () => {
    mockFs.readDirectory.mockResolvedValue([]);

    const result = await listWorkspaceEntries(uri);

    expect(result).toEqual({ success: true, value: [] });
  });

  it('returns WORKSPACE_DIR_LIST_ERROR when readDirectory fails', async () => {
    mockFs.readDirectory.mockRejectedValue(new Error('FileNotFound'));

    const result = await listWorkspaceEntries(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_DIR_LIST_ERROR');
      expect(result.error.message).toContain(uri.fsPath);
    }
  });

  it('preserves the original error as cause', async () => {
    const originalError = new Error('FileNotFound');
    mockFs.readDirectory.mockRejectedValue(originalError);

    const result = await listWorkspaceEntries(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.cause).toBe(originalError);
    }
  });
});
