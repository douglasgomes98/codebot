import * as vscode from 'vscode';
import { processTemplateFolder } from '../../../helpers/template/processTemplateFolder';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;

const encode = (s: string) => new TextEncoder().encode(s);

describe('processTemplateFolder', () => {
  beforeEach(() => jest.clearAllMocks());

  const templateUri = vscode.Uri.file('/workspace/templates/ComponentSass');

  describe('ComponentSass template', () => {
    beforeEach(() => {
      mockFs.readDirectory.mockResolvedValue([
        ['ComponentSass.tsx.hbs', 1],
        ['ComponentSass.module.scss.hbs', 1],
        ['index.tsx.hbs', 1],
      ] as never);

      mockFs.readFile
        .mockResolvedValueOnce(
          encode('export const {{name}} = () => <div />;') as never,
        )
        .mockResolvedValueOnce(encode('.{{name}} { color: red; }') as never)
        .mockResolvedValueOnce(
          encode("export { default } from './{{name}}';") as never,
        );
    });

    it('renames template files and compiles content', async () => {
      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const paths = result.value.map(f => f.targetRelativePath);
        expect(paths).toContain('Button.tsx');
        expect(paths).toContain('Button.module.scss');
        expect(paths).toContain('index.tsx');
      }
    });

    it('compiles Handlebars expressions with component name', async () => {
      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const main = result.value.find(
          f => f.targetRelativePath === 'Button.tsx',
        );
        expect(main?.content).toBe('export const Button = () => <div />;');

        const scss = result.value.find(
          f => f.targetRelativePath === 'Button.module.scss',
        );
        expect(scss?.content).toBe('.Button { color: red; }');
      }
    });
  });

  describe('ReactPackage template with nested directories', () => {
    it('preserves nested directory structure in target paths', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([
          ['src', 2],
          ['package.json.hbs', 1],
        ] as never)
        .mockResolvedValueOnce([
          ['App.tsx.hbs', 1],
          ['lib', 2],
        ] as never)
        .mockResolvedValueOnce([['main.ts.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      const result = await processTemplateFolder(
        templateUri,
        'ReactPackage',
        'MyApp',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const paths = result.value.map(f => f.targetRelativePath);
        expect(paths).toContain('src/App.tsx');
        expect(paths).toContain('src/lib/main.ts');
        expect(paths).toContain('package.json');
      }
    });
  });

  describe('error handling', () => {
    it('propagates walk error', async () => {
      mockFs.readDirectory.mockRejectedValue(new Error('ENOENT'));

      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKSPACE_DIR_LIST_ERROR');
      }
    });

    it('propagates read error for a template file', async () => {
      mockFs.readDirectory.mockResolvedValue([
        ['ComponentSass.tsx.hbs', 1],
      ] as never);
      mockFs.readFile.mockRejectedValue(new Error('Read failed'));

      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKSPACE_FILE_READ_ERROR');
      }
    });

    it('returns error when two template files compile to the same output path', async () => {
      // Both "ComponentSass.tsx.hbs" and "Template.tsx.hbs" resolve to "Button.tsx"
      mockFs.readDirectory.mockResolvedValue([
        ['ComponentSass.tsx.hbs', 1],
        ['Template.tsx.hbs', 1],
      ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TEMPLATE_DUPLICATE_PATH');
      }
    });
  });

  describe('non-.hbs files', () => {
    it('skips files that are not .hbs templates', async () => {
      mockFs.readDirectory.mockResolvedValue([
        ['Button.tsx.hbs', 1],
        ['.gitkeep', 1],
      ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      const result = await processTemplateFolder(
        templateUri,
        'ComponentSass',
        'Button',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].targetRelativePath).toBe('Button.tsx');
      }
    });
  });
});
