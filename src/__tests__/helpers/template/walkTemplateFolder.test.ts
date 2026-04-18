import * as vscode from 'vscode';
import { walkTemplateFolder } from '../../../helpers/template/walkTemplateFolder';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

describe('walkTemplateFolder', () => {
  beforeEach(() => jest.clearAllMocks());

  const templateUri = vscode.Uri.file('/workspace/templates/ComponentSass');

  it('returns flat list for a flat template folder', async () => {
    mockFs.readDirectory.mockResolvedValue([
      ['ComponentSass.tsx.hbs', 1],
      ['ComponentSass.module.scss.hbs', 1],
      ['index.tsx.hbs', 1],
    ] as never);

    const result = await walkTemplateFolder(templateUri);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.map(e => e.relativePath)).toEqual([
        'ComponentSass.tsx.hbs',
        'ComponentSass.module.scss.hbs',
        'index.tsx.hbs',
      ]);
    }
  });

  it('returns nested paths for a template with subdirectories', async () => {
    mockFs.readDirectory
      .mockResolvedValueOnce([
        ['src', 2],
        ['package.json.hbs', 1],
      ] as never)
      .mockResolvedValueOnce([
        ['main.tsx.hbs', 1],
        ['lib', 2],
      ] as never)
      .mockResolvedValueOnce([['index.ts.hbs', 1]] as never);

    const result = await walkTemplateFolder(templateUri);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.map(e => e.relativePath)).toEqual([
        'src/main.tsx.hbs',
        'src/lib/index.ts.hbs',
        'package.json.hbs',
      ]);
    }
  });

  it('returns empty array for an empty template folder', async () => {
    mockFs.readDirectory.mockResolvedValue([]);

    const result = await walkTemplateFolder(templateUri);

    expect(result).toEqual({ success: true, value: [] });
  });

  it('propagates error from nested directory read', async () => {
    mockFs.readDirectory
      .mockResolvedValueOnce([['src', 2]] as never)
      .mockRejectedValueOnce(new Error('Permission denied'));

    const result = await walkTemplateFolder(templateUri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WORKSPACE_DIR_LIST_ERROR');
    }
  });

  it('includes the uri for each entry', async () => {
    mockFs.readDirectory.mockResolvedValue([['Button.tsx.hbs', 1]] as never);

    const result = await walkTemplateFolder(templateUri);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value[0].uri).toBeDefined();
      expect(result.value[0].uri.fsPath).toContain('Button.tsx.hbs');
    }
  });

  it('returns error when folder nesting exceeds MAX_DEPTH', async () => {
    // Simulate 11 levels of nesting (depth 0–10 = 11 calls, depth 11 = exceeded)
    mockFs.readDirectory.mockResolvedValue([['nested', 2]] as never);

    const result = await walkTemplateFolder(templateUri);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('TEMPLATE_MAX_DEPTH_EXCEEDED');
    }
  });
});
