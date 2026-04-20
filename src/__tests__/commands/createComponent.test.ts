import * as vscode from 'vscode';
import { createComponent } from '../../commands/createComponent';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;
const mockWindow = vscode.window as jest.Mocked<typeof vscode.window>;
const mockGetConfiguration = vscode.workspace
  .getConfiguration as jest.MockedFunction<
  typeof vscode.workspace.getConfiguration
>;

const encode = (s: string) => new TextEncoder().encode(s);

const clickedUri = vscode.Uri.file('/test/workspace/src/components');

const setupConfig = (
  templatesFolderPath = 'templates',
  templateSettings: Record<string, { nameFormat?: string }> = {},
) => {
  mockGetConfiguration.mockReturnValue({
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'templatesFolderPath') return templatesFolderPath;
      if (key === 'templateSettings') return templateSettings;
      return undefined;
    }),
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn(),
  } as unknown as vscode.WorkspaceConfiguration);
};

const setupSingleTemplate = (
  templateName: string,
  files: [string, number][],
) => {
  mockFs.readDirectory.mockResolvedValueOnce([[templateName, 2]] as never);
  mockFs.readDirectory.mockResolvedValueOnce(files as never);
};

describe('createComponent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupConfig();
  });

  describe('guard clauses', () => {
    it('shows error and returns when no URI is provided', async () => {
      await createComponent(undefined);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Right-click'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when workspace folder is not found', async () => {
      const outsideUri = vscode.Uri.file('/outside/any/workspace');

      await createComponent(outsideUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('workspace folder'),
      );
    });

    it('shows error when templates folder cannot be read', async () => {
      mockFs.readDirectory.mockRejectedValue(new Error('ENOENT'));

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('templates'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when no templates are found', async () => {
      mockFs.readDirectory.mockResolvedValue([['README.md', 1]] as never);

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found'),
      );
    });

    it('returns silently when user cancels template selection', async () => {
      mockFs.readDirectory.mockResolvedValueOnce([
        ['ComponentSass', 2],
        ['ComponentTailwind', 2],
      ] as never);
      mockWindow.showInputBox.mockResolvedValue('Button');
      mockWindow.showQuickPick.mockResolvedValue(undefined);

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).not.toHaveBeenCalled();
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled();
    });

    it('returns silently when user cancels component name input', async () => {
      setupSingleTemplate('ComponentSass', []);
      mockWindow.showInputBox.mockResolvedValue(undefined);

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).not.toHaveBeenCalled();
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('happy path — single template', () => {
    beforeEach(() => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile
        .mockResolvedValueOnce(
          encode('export const {{name}} = () => null;') as never,
        )
        .mockResolvedValueOnce(
          encode("export { {{name}} } from './{{name}}';") as never,
        );

      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockWindow.showInputBox.mockResolvedValue('Button');
    });

    it('auto-selects the only template without showing QuickPick', async () => {
      await createComponent(clickedUri);

      expect(mockWindow.showQuickPick).not.toHaveBeenCalled();
    });

    it('writes all template files to the target folder', async () => {
      await createComponent(clickedUri);

      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('writes files at the correct URIs', async () => {
      await createComponent(clickedUri);

      const writtenPaths = mockFs.writeFile.mock.calls.map(
        ([uri]) => (uri as vscode.Uri).fsPath,
      );
      expect(writtenPaths.some(p => p.endsWith('Button/Button.tsx'))).toBe(
        true,
      );
      expect(writtenPaths.some(p => p.endsWith('Button/index.tsx'))).toBe(true);
    });

    it('compiles the component name into template content', async () => {
      await createComponent(clickedUri);

      const found = mockFs.writeFile.mock.calls.find(([uri]) =>
        (uri as vscode.Uri).fsPath.endsWith('Button.tsx'),
      );
      expect(found).toBeDefined();
      const [, content] = found ?? [];

      const text = new TextDecoder().decode(content as Uint8Array);
      expect(text).toBe('export const Button = () => null;');
    });

    it('shows success message', async () => {
      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'Button' created"),
      );
    });
  });

  describe('happy path — multiple templates', () => {
    it('shows QuickPick and uses the selected template', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([
          ['ComponentSass', 2],
          ['ComponentTailwind', 2],
        ] as never)
        .mockResolvedValueOnce([['ComponentTailwind.tsx.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockWindow.showQuickPick.mockResolvedValue('ComponentTailwind' as never);
      mockWindow.showInputBox.mockResolvedValue('Card');

      await createComponent(clickedUri);

      expect(mockWindow.showQuickPick).toHaveBeenCalledWith(
        ['ComponentSass', 'ComponentTailwind'],
        expect.anything(),
      );
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'Card' created"),
      );
    });
  });

  describe('error scenarios', () => {
    it('shows error when template processing fails (e.g. unreadable .hbs file)', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when template folder nesting exceeds the depth limit', async () => {
      // First call lists the template; subsequent calls always return a subdirectory,
      // forcing walkTemplateFolder past MAX_DEPTH.
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValue([['nested', 2]] as never);

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when two template files resolve to the same output path', async () => {
      // "ComponentSass.tsx.hbs" and "Template.tsx.hbs" both compile to "Button.tsx"
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['Template.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error and stops when folder creation fails', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockRejectedValue(new Error('No permissions'));

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create folder'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error and stops when file write fails', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write'),
      );
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('does not write remaining files after the first write failure', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile
        .mockRejectedValueOnce(new Error('Disk full'))
        .mockResolvedValue(undefined);

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('file skipping', () => {
    it('skips files that already exist and reports them', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      // First file exists, second does not
      mockFs.stat
        .mockResolvedValueOnce({
          type: 1,
          ctime: 0,
          mtime: 0,
          size: 1,
        } as never)
        .mockRejectedValueOnce(new Error('not found'));

      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('skipped'),
      );
    });
  });

  describe('custom templates folder path', () => {
    it('uses the configured templatesFolderPath', async () => {
      setupConfig('src/templates');

      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      mockWindow.showInputBox.mockResolvedValue('Button');

      await createComponent(clickedUri);

      const readDirCalls = mockFs.readDirectory.mock.calls;
      expect(readDirCalls[0][0].fsPath).toContain('src/templates');
    });
  });

  describe('name formatting (default: pascal-case)', () => {
    const setupTemplate = () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);
      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    };

    it('converts lowercase input to PascalCase', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('button');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'Button' created"),
      );
    });

    it('converts kebab-case input to PascalCase', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('my-card');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyCard' created"),
      );
    });

    it('converts camelCase input to PascalCase', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('myComponent');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyComponent' created"),
      );
    });
  });

  describe('multi-root workspace', () => {
    const appClickedUri = vscode.Uri.file('/test/packages/app/src/components');
    const libClickedUri = vscode.Uri.file('/test/packages/lib/src/components');

    beforeEach(() => {
      (
        vscode.workspace as unknown as Record<string, unknown>
      ).workspaceFolders = [
        { uri: { fsPath: '/test/packages/app' }, name: 'app', index: 0 },
        { uri: { fsPath: '/test/packages/lib' }, name: 'lib', index: 1 },
      ];

      const configFactory = (
        _section?: string,
        scope?: vscode.ConfigurationScope | null,
      ): vscode.WorkspaceConfiguration => {
        const fsPath =
          scope != null && 'fsPath' in scope
            ? (scope as vscode.Uri).fsPath
            : undefined;
        return {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'templatesFolderPath') return 'templates';
            if (key === 'templateSettings') {
              return fsPath?.startsWith('/test/packages/app')
                ? { ReactPackage: { nameFormat: 'kebab-case' } }
                : {};
            }
            return undefined;
          }),
          update: jest.fn(),
          has: jest.fn(),
          inspect: jest.fn(),
        } as unknown as vscode.WorkspaceConfiguration;
      };

      mockGetConfiguration.mockImplementation(configFactory);
    });

    afterEach(() => {
      (
        vscode.workspace as unknown as Record<string, unknown>
      ).workspaceFolders = [
        { uri: { fsPath: '/test/workspace' }, name: 'workspace', index: 0 },
      ];
    });

    const setupTemplate = () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ReactPackage', 2]] as never)
        .mockResolvedValueOnce([['index.hbs', 1]] as never);
      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    };

    it('applies nameFormat from the workspace folder containing the clicked path', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('my-package');

      await createComponent(appClickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my-package' created"),
      );
    });

    it('applies a different config when clicking inside a different workspace folder', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('my-package');

      await createComponent(libClickedUri);

      // lib has no nameFormat → falls back to pascal-case
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyPackage' created"),
      );
    });

    it('passes clickedUri to getConfiguration, not the workspace folder root', async () => {
      setupTemplate();
      mockWindow.showInputBox.mockResolvedValue('my-package');

      await createComponent(appClickedUri);

      expect(mockGetConfiguration).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fsPath: appClickedUri.fsPath }),
      );
    });
  });

  describe('nameFormat per template', () => {
    const setupTemplateWithFormat = (
      templateName: string,
      nameFormat: string,
    ) => {
      setupConfig('templates', { [templateName]: { nameFormat } });
      mockFs.readDirectory
        .mockResolvedValueOnce([[templateName, 2]] as never)
        .mockResolvedValueOnce([['index.hbs', 1]] as never);
      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    };

    it('applies kebab-case format when configured for the selected template', async () => {
      setupTemplateWithFormat('ReactPackage', 'kebab-case');
      mockWindow.showInputBox.mockResolvedValue('my-package');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my-package' created"),
      );
    });

    it('applies camel-case format when configured', async () => {
      setupTemplateWithFormat('MyTemplate', 'camel-case');
      mockWindow.showInputBox.mockResolvedValue('my-component');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'myComponent' created"),
      );
    });

    it('applies snake-case format when configured', async () => {
      setupTemplateWithFormat('MyTemplate', 'snake-case');
      mockWindow.showInputBox.mockResolvedValue('MyComponent');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my_component' created"),
      );
    });

    it('falls back to pascal-case when template has no nameFormat setting', async () => {
      setupConfig('templates', {});
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);
      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockWindow.showInputBox.mockResolvedValue('my-button');

      await createComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyButton' created"),
      );
    });

    it('uses formatted name in compiled template content', async () => {
      setupTemplateWithFormat('ReactPackage', 'kebab-case');
      mockWindow.showInputBox.mockResolvedValue('my-package');

      await createComponent(clickedUri);

      const [, content] = mockFs.writeFile.mock.calls[0] ?? [];
      const text = new TextDecoder().decode(content as Uint8Array);
      expect(text).toBe('// my-package');
    });
  });
});
