import * as vscode from 'vscode';
import { updateComponent } from '../../commands/updateComponent';

const mockFs = vscode.workspace.fs as jest.Mocked<typeof vscode.workspace.fs>;
const mockWindow = vscode.window as jest.Mocked<typeof vscode.window>;
const mockGetConfiguration = vscode.workspace
  .getConfiguration as jest.MockedFunction<
  typeof vscode.workspace.getConfiguration
>;

const encode = (s: string) => new TextEncoder().encode(s);

// Clicking directly on the component folder (e.g. src/components/Button)
const clickedUri = vscode.Uri.file('/test/workspace/src/components/Button');

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

describe('updateComponent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupConfig();
  });

  describe('guard clauses', () => {
    it('shows error when no URI is provided', async () => {
      await updateComponent(undefined);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Right-click'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when clicked folder name is not a valid component name', async () => {
      const invalidUri = vscode.Uri.file('/test/workspace/src/1invalid');

      await updateComponent(invalidUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('1invalid'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when workspace folder is not found', async () => {
      const outsideUri = vscode.Uri.file('/outside/any/workspace/Button');

      await updateComponent(outsideUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('workspace folder'),
      );
    });

    it('shows error when templates folder cannot be read', async () => {
      mockFs.readDirectory.mockRejectedValue(new Error('ENOENT'));

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('templates'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when no templates are found', async () => {
      mockFs.readDirectory.mockResolvedValue([['README.md', 1]] as never);

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found'),
      );
    });

    it('returns silently when user cancels template selection', async () => {
      mockFs.readDirectory.mockResolvedValueOnce([
        ['ComponentSass', 2],
        ['ComponentTailwind', 2],
      ] as never);
      mockWindow.showQuickPick.mockResolvedValue(undefined);

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).not.toHaveBeenCalled();
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('happy path — uses folder name as component name', () => {
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
    });

    it('does not ask for a component name', async () => {
      await updateComponent(clickedUri);

      expect(mockWindow.showInputBox).not.toHaveBeenCalled();
    });

    it('writes files directly into the clicked folder, not a subfolder', async () => {
      await updateComponent(clickedUri);

      const writtenPaths = mockFs.writeFile.mock.calls.map(
        ([uri]) => (uri as vscode.Uri).fsPath,
      );

      // Parent of Button.tsx must be the clicked folder itself, not a nested subfolder
      const nodePath = require('node:path');
      const buttonFile = writtenPaths.find(p => p.endsWith('Button.tsx'));
      const indexFile = writtenPaths.find(p => p.endsWith('index.tsx'));
      expect(buttonFile).toBeDefined();
      expect(indexFile).toBeDefined();
      expect(nodePath.dirname(buttonFile ?? '')).toBe(clickedUri.fsPath);
      expect(nodePath.dirname(indexFile ?? '')).toBe(clickedUri.fsPath);
    });

    it('compiles the folder name as component name into template content', async () => {
      await updateComponent(clickedUri);

      const found = mockFs.writeFile.mock.calls.find(([uri]) =>
        (uri as vscode.Uri).fsPath.endsWith('Button.tsx'),
      );
      expect(found).toBeDefined();
      const [, content] = found ?? [];

      const text = new TextDecoder().decode(content as Uint8Array);
      expect(text).toBe('export const Button = () => null;');
    });

    it('shows success message with "updated"', async () => {
      await updateComponent(clickedUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'Button' updated"),
      );
    });
  });

  describe('skipping existing files', () => {
    it('skips files that already exist', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
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

      await updateComponent(clickedUri);

      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('skipped'),
      );
    });

    it('shows "already up to date" when all files exist', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['index.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockResolvedValue({
        type: 1,
        ctime: 0,
        mtime: 0,
        size: 1,
      } as never);

      await updateComponent(clickedUri);

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('already up to date'),
      );
    });
  });

  describe('name formatting (default: pascal-case)', () => {
    it('converts a kebab-case folder name to PascalCase', async () => {
      const kebabUri = vscode.Uri.file(
        '/test/workspace/src/components/my-button',
      );

      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await updateComponent(kebabUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyButton' updated"),
      );
    });

    it('converts snake_case folder name to PascalCase', async () => {
      const snakeUri = vscode.Uri.file(
        '/test/workspace/src/components/my_card',
      );

      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await updateComponent(snakeUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyCard' updated"),
      );
    });
  });

  describe('multi-root workspace', () => {
    const appClickedUri = vscode.Uri.file(
      '/test/packages/app/src/components/MyButton',
    );
    const libClickedUri = vscode.Uri.file(
      '/test/packages/lib/src/components/MyButton',
    );

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

      await updateComponent(appClickedUri);

      // app has kebab-case → 'MyButton' becomes 'my-button'
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my-button' updated"),
      );
    });

    it('applies a different config when clicking inside a different workspace folder', async () => {
      setupTemplate();

      await updateComponent(libClickedUri);

      // lib has no nameFormat → falls back to pascal-case → 'MyButton' stays
      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'MyButton' updated"),
      );
    });

    it('passes clickedUri to getConfiguration, not the workspace folder root', async () => {
      setupTemplate();

      await updateComponent(appClickedUri);

      expect(mockGetConfiguration).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fsPath: appClickedUri.fsPath }),
      );
    });

    it('does not confuse a folder whose name is a prefix of another folder', async () => {
      (
        vscode.workspace as unknown as Record<string, unknown>
      ).workspaceFolders = [
        { uri: { fsPath: '/test/packages/app' }, name: 'app', index: 0 },
        {
          uri: { fsPath: '/test/packages/application' },
          name: 'application',
          index: 1,
        },
      ];

      const applicationUri = vscode.Uri.file(
        '/test/packages/application/src/components/MyButton',
      );
      setupTemplate();

      await updateComponent(applicationUri);

      // templates must be looked up under /test/packages/application, not /test/packages/app
      const templatesDirCall = mockFs.readDirectory.mock
        .calls[0][0] as vscode.Uri;
      expect(templatesDirCall.fsPath).toContain('/test/packages/application');
      expect(templatesDirCall.fsPath).not.toMatch(/\/test\/packages\/app\b/);
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

    it('applies kebab-case format: keeps kebab folder name as-is', async () => {
      const kebabUri = vscode.Uri.file(
        '/test/workspace/src/packages/my-package',
      );
      setupTemplateWithFormat('ReactPackage', 'kebab-case');

      await updateComponent(kebabUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my-package' updated"),
      );
    });

    it('applies kebab-case format: converts PascalCase folder name to kebab', async () => {
      const pascalUri = vscode.Uri.file(
        '/test/workspace/src/packages/MyPackage',
      );
      setupTemplateWithFormat('ReactPackage', 'kebab-case');

      await updateComponent(pascalUri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my-package' updated"),
      );
    });

    it('applies camel-case format', async () => {
      const uri = vscode.Uri.file('/test/workspace/src/components/my-button');
      setupTemplateWithFormat('MyTemplate', 'camel-case');

      await updateComponent(uri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'myButton' updated"),
      );
    });

    it('applies snake-case format', async () => {
      const uri = vscode.Uri.file('/test/workspace/src/components/MyButton');
      setupTemplateWithFormat('MyTemplate', 'snake-case');

      await updateComponent(uri);

      expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("'my_button' updated"),
      );
    });

    it('uses formatted name in compiled template content', async () => {
      const uri = vscode.Uri.file('/test/workspace/src/packages/my-package');
      setupTemplateWithFormat('ReactPackage', 'kebab-case');

      await updateComponent(uri);

      const [, content] = mockFs.writeFile.mock.calls[0] ?? [];
      const text = new TextDecoder().decode(content as Uint8Array);
      expect(text).toBe('// my-package');
    });
  });

  describe('error scenarios', () => {
    it('shows error when template processing fails', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when template folder nesting exceeds the depth limit', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValue([['nested', 2]] as never);

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error when two template files resolve to the same output path', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([
          ['ComponentSass.tsx.hbs', 1],
          ['Template.tsx.hbs', 1],
        ] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process template'),
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('shows error and stops when folder creation fails', async () => {
      mockFs.readDirectory
        .mockResolvedValueOnce([['ComponentSass', 2]] as never)
        .mockResolvedValueOnce([['ComponentSass.tsx.hbs', 1]] as never);

      mockFs.readFile.mockResolvedValue(encode('// {{name}}') as never);
      mockFs.stat.mockRejectedValue(new Error('not found'));
      mockFs.createDirectory.mockRejectedValue(new Error('No permissions'));

      await updateComponent(clickedUri);

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

      await updateComponent(clickedUri);

      expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write'),
      );
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockWindow.showInformationMessage).not.toHaveBeenCalled();
    });
  });
});
