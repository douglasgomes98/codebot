import * as vscode from 'vscode';
import { listTemplates } from '../../../helpers/template/listTemplates';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('listTemplates', () => {
  beforeEach(() => jest.clearAllMocks());

  const uri = vscode.Uri.file('/workspace/templates');

  it('returns only directory names', async () => {
    mockFs.readDirectory.mockResolvedValue([
      ['ComponentSass', 2],
      ['ComponentTailwind', 2],
      ['README.md', 1],
    ] as never);

    const result = await listTemplates(uri);

    expect(result).toEqual({
      success: true,
      value: ['ComponentSass', 'ComponentTailwind'],
    });
  });

  it('returns empty array when no directories exist', async () => {
    mockFs.readDirectory.mockResolvedValue([['README.md', 1]] as never);

    const result = await listTemplates(uri);

    expect(result).toEqual({ success: true, value: [] });
  });

  it('returns empty array for empty templates folder', async () => {
    mockFs.readDirectory.mockResolvedValue([]);

    const result = await listTemplates(uri);

    expect(result).toEqual({ success: true, value: [] });
  });

  it('propagates error when folder cannot be read', async () => {
    mockFs.readDirectory.mockRejectedValue(new Error('ENOENT'));

    const result = await listTemplates(uri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_DIR_LIST_ERROR');
    }
  });
});
