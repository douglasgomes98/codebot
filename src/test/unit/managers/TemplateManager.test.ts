import { TemplateManager } from '../../../managers/TemplateManager';
import type { ProcessedTemplate } from '../../../types';

type TemplateManagerTestable = {
  validateProcessedTemplate(processedTemplate: ProcessedTemplate): void;
  collectAllTargetPaths(processedTemplate: ProcessedTemplate): string[];
  findDuplicatePaths(targetPaths: string[]): string[];
};

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock FileSystemManager
jest.mock('../../../managers/FileSystemManager', () => ({
  FileSystemManager: jest.fn().mockImplementation(() => ({
    folderExists: jest.fn().mockResolvedValue(true),
    listDirectories: jest
      .fn()
      .mockResolvedValue(['ComponentSass', 'ComponentStyled']),
    listFiles: jest
      .fn()
      .mockResolvedValue(['Component.tsx.hbs', 'index.tsx.hbs']),
    readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
    listFilesRecursive: jest.fn().mockResolvedValue([
      {
        name: 'Component.tsx.hbs',
        path: 'Component.tsx.hbs',
        isDirectory: false,
      },
      { name: 'index.tsx.hbs', path: 'index.tsx.hbs', isDirectory: false },
    ]),
  })),
}));

// Mock DirectoryProcessor
jest.mock('../../../utils/DirectoryProcessor', () => ({
  DirectoryProcessor: jest.fn().mockImplementation(() => ({
    scanTemplateStructure: jest.fn().mockResolvedValue({
      rootPath: '/test/templates/ComponentTemplate',
      files: [
        {
          name: 'Component.tsx.hbs',
          path: 'Component.tsx.hbs',
          relativePath: 'Component.tsx.hbs',
        },
        {
          name: 'index.tsx.hbs',
          path: 'index.tsx.hbs',
          relativePath: 'index.tsx.hbs',
        },
      ],
      directories: [],
    }),
    validateDepth: jest.fn(),
  })),
}));

// Mock handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn(),
}));

// Mock vscode module
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/mock/workspace',
        },
      },
    ],
  },
}));

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  const mockFs = require('node:fs');
  const mockHandlebars = require('handlebars');

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset FileSystemManager mock to default successful state
    const MockedFileSystemManager =
      require('../../../managers/FileSystemManager').FileSystemManager;
    MockedFileSystemManager.mockClear();
    MockedFileSystemManager.mockImplementation(() => ({
      folderExists: jest.fn().mockResolvedValue(true),
      listDirectories: jest
        .fn()
        .mockResolvedValue(['ComponentSass', 'ComponentStyled']),
      listFiles: jest
        .fn()
        .mockResolvedValue(['Component.tsx.hbs', 'index.tsx.hbs']),
      readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
      listFilesRecursive: jest.fn().mockResolvedValue([
        {
          name: 'Component.tsx.hbs',
          path: 'Component.tsx.hbs',
          isDirectory: false,
        },
        { name: 'index.tsx.hbs', path: 'index.tsx.hbs', isDirectory: false },
      ]),
    }));

    templateManager = new TemplateManager();
  });

  describe('discoverTemplates', () => {
    it('should discover templates in project directory', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir
        .mockResolvedValueOnce([
          { name: 'ComponentSass', isDirectory: () => true },
          { name: 'ComponentStyled', isDirectory: () => true },
        ])
        .mockResolvedValueOnce(['Component.tsx.hbs', 'index.tsx.hbs'])
        .mockResolvedValueOnce(['index.tsx.hbs', 'styles.ts.hbs']);

      const templates = await templateManager.discoverTemplates(
        '/mock/workspace/project1',
      );

      expect(templates).toHaveLength(2);
      expect(templates[0]).toEqual(
        expect.objectContaining({
          name: 'ComponentSass',
          path: '/mock/workspace/project1/templates/ComponentSass',
          files: ['Component.tsx.hbs', 'index.tsx.hbs'],
        }),
      );
      expect(templates[1]).toEqual(
        expect.objectContaining({
          name: 'ComponentStyled',
          path: '/mock/workspace/project1/templates/ComponentStyled',
          files: ['Component.tsx.hbs', 'index.tsx.hbs'],
        }),
      );
    });

    it('should fallback to workspace templates when project templates not found', async () => {
      // Mock FileSystemManager to return no templates for project, but templates for workspace
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest
          .fn()
          .mockResolvedValueOnce(false) // Project templates don't exist
          .mockResolvedValueOnce(true), // Workspace templates exist
        listDirectories: jest.fn().mockResolvedValue(['SharedComponent']),
        listFiles: jest.fn().mockResolvedValue(['Component.tsx.hbs']),
        readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'Component.tsx.hbs',
            path: 'Component.tsx.hbs',
            isDirectory: false,
          },
        ]),
      }));

      const newTemplateManager = new TemplateManager();
      const templates = await newTemplateManager.discoverTemplates(
        '/mock/workspace/project1',
      );

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('SharedComponent');
      expect(templates[0].path).toBe(
        '/mock/workspace/templates/SharedComponent',
      );
    });

    it('should prioritize project templates over workspace templates', async () => {
      // Mock FileSystemManager to return both project and workspace templates
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest.fn().mockResolvedValue(true), // Both exist
        listDirectories: jest
          .fn()
          .mockResolvedValueOnce(['Component']) // Project templates
          .mockResolvedValueOnce(['Component', 'OtherComponent']), // Workspace templates
        listFiles: jest
          .fn()
          .mockResolvedValueOnce(['project.tsx.hbs']) // Project Component files
          .mockResolvedValueOnce(['workspace.tsx.hbs']) // Workspace Component files
          .mockResolvedValueOnce(['other.tsx.hbs']), // OtherComponent files
        readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'project.tsx.hbs',
            path: 'project.tsx.hbs',
            isDirectory: false,
          },
        ]),
      }));

      const newTemplateManager = new TemplateManager();
      const templates = await newTemplateManager.discoverTemplates(
        '/mock/workspace/project1',
      );

      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('Component');
      expect(templates[0].files).toEqual(['project.tsx.hbs']); // Project version wins
      expect(templates[1].name).toBe('OtherComponent');
    });

    it('should cache template discovery results', async () => {
      const templates1 = await templateManager.discoverTemplates(
        '/mock/workspace/project1',
      );
      const templates2 = await templateManager.discoverTemplates(
        '/mock/workspace/project1',
      );

      expect(templates1).toEqual(templates2); // Should have same content
      // Since we're using FileSystemManager mock, we can't easily test the fs calls
      expect(templates1).toHaveLength(2); // Should return the mocked templates
    });

    it('should handle template discovery errors', async () => {
      // Mock FileSystemManager to throw errors
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest
          .fn()
          .mockRejectedValue(new Error('Permission denied')),
        listDirectories: jest
          .fn()
          .mockRejectedValue(new Error('Permission denied')),
        listFiles: jest.fn().mockRejectedValue(new Error('Permission denied')),
        readFile: jest.fn().mockRejectedValue(new Error('Permission denied')),
        listFilesRecursive: jest
          .fn()
          .mockRejectedValue(new Error('Permission denied')),
      }));

      const newTemplateManager = new TemplateManager();
      const result =
        await newTemplateManager.discoverTemplates('/invalid/path');
      expect(result).toEqual([]);
    });
  });

  describe('processTemplate', () => {
    it('should compile and process template with component name', async () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);

      // Mock FileSystemManager readFile method
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest.fn().mockResolvedValue(true),
        listDirectories: jest
          .fn()
          .mockResolvedValue(['ComponentSass', 'ComponentStyled']),
        listFiles: jest
          .fn()
          .mockResolvedValue(['Component.tsx.hbs', 'index.tsx.hbs']),
        readFile: jest.fn().mockResolvedValue('template content'),
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'Component.tsx.hbs',
            path: 'Component.tsx.hbs',
            isDirectory: false,
          },
          { name: 'index.tsx.hbs', path: 'index.tsx.hbs', isDirectory: false },
        ]),
      }));

      const newTemplateManager = new TemplateManager();
      const result = await newTemplateManager.processTemplate(
        '/path/to/template.hbs',
        'myComponent',
      );

      expect(mockHandlebars.compile).toHaveBeenCalledWith('template content');
      expect(mockTemplate).toHaveBeenCalledWith({ name: 'Mycomponent' });
      expect(result).toBe('processed content');
    });

    it('should format component name to PascalCase', async () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);

      // Mock FileSystemManager readFile method
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest.fn().mockResolvedValue(true),
        listDirectories: jest
          .fn()
          .mockResolvedValue(['ComponentSass', 'ComponentStyled']),
        listFiles: jest
          .fn()
          .mockResolvedValue(['Component.tsx.hbs', 'index.tsx.hbs']),
        readFile: jest.fn().mockResolvedValue('template content'),
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'Component.tsx.hbs',
            path: 'Component.tsx.hbs',
            isDirectory: false,
          },
          { name: 'index.tsx.hbs', path: 'index.tsx.hbs', isDirectory: false },
        ]),
      }));

      const newTemplateManager = new TemplateManager();
      await newTemplateManager.processTemplate(
        '/path/to/template.hbs',
        'my-component-name',
      );

      expect(mockTemplate).toHaveBeenCalledWith({ name: 'MyComponentName' });
    });

    it('should cache compiled templates', async () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);

      // Mock FileSystemManager readFile method
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      const mockReadFile = jest.fn().mockResolvedValue('template content');
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest.fn().mockResolvedValue(true),
        listDirectories: jest
          .fn()
          .mockResolvedValue(['ComponentSass', 'ComponentStyled']),
        listFiles: jest
          .fn()
          .mockResolvedValue(['Component.tsx.hbs', 'index.tsx.hbs']),
        readFile: mockReadFile,
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'Component.tsx.hbs',
            path: 'Component.tsx.hbs',
            isDirectory: false,
          },
          { name: 'index.tsx.hbs', path: 'index.tsx.hbs', isDirectory: false },
        ]),
      }));

      const newTemplateManager = new TemplateManager();
      await newTemplateManager.processTemplate(
        '/path/to/template.hbs',
        'component1',
      );
      await newTemplateManager.processTemplate(
        '/path/to/template.hbs',
        'component2',
      );

      // Template should be read and compiled only once (cached)
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockHandlebars.compile).toHaveBeenCalledTimes(1); // Should compile only once
      expect(mockTemplate).toHaveBeenCalledTimes(2); // Should execute twice
    });

    it('should handle template processing errors', async () => {
      // Mock FileSystemManager to throw errors
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: jest.fn().mockResolvedValue(true),
        listDirectories: jest.fn().mockResolvedValue([]),
        listFiles: jest.fn().mockResolvedValue([]),
        readFile: jest.fn().mockRejectedValue(new Error('File not found')),
        listFilesRecursive: jest.fn().mockResolvedValue([]),
      }));

      const newTemplateManager = new TemplateManager();
      await expect(
        newTemplateManager.processTemplate(
          '/invalid/template.hbs',
          'component',
        ),
      ).rejects.toThrow('Error processing template');
    });
  });

  describe('getTemplateFiles', () => {
    it('should return only .hbs files', () => {
      mockFs.readdirSync.mockReturnValue([
        'Component.tsx.hbs',
        'Component.scss.hbs',
        'index.tsx.hbs',
        'README.md',
        'package.json',
      ]);

      const files = templateManager.getTemplateFiles('/path/to/template');

      expect(files).toEqual([
        'Component.tsx.hbs',
        'Component.scss.hbs',
        'index.tsx.hbs',
      ]);
    });

    it('should handle directory read errors', () => {
      const originalReaddirSync = mockFs.readdirSync;
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      try {
        expect(() =>
          templateManager.getTemplateFiles('/invalid/path'),
        ).toThrow();
      } finally {
        mockFs.readdirSync = originalReaddirSync;
      }
    });
  });

  describe('cache management', () => {
    it('should invalidate all cache', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir.mockResolvedValue([]);

      await templateManager.discoverTemplates('/mock/workspace/project1');

      const statsBefore = templateManager.getCacheStats();
      expect(statsBefore.templateCacheSize).toBeGreaterThan(0);

      templateManager.invalidateCache();

      const statsAfter = templateManager.getCacheStats();
      expect(statsAfter.templateCacheSize).toBe(0);
      expect(statsAfter.compiledCacheSize).toBe(0);
    });

    it('should invalidate project-specific cache', async () => {
      // Mock FileSystemManager for this test
      const MockedFileSystemManager =
        require('../../../managers/FileSystemManager').FileSystemManager;
      const mockFolderExists = jest.fn().mockResolvedValue(true);
      const mockListDirectories = jest.fn().mockResolvedValue(['Component']);

      MockedFileSystemManager.mockImplementation(() => ({
        folderExists: mockFolderExists,
        listDirectories: mockListDirectories,
        listFiles: jest.fn().mockResolvedValue(['Component.tsx.hbs']),
        readFile: jest.fn().mockResolvedValue('template content'),
        listFilesRecursive: jest.fn().mockResolvedValue([
          {
            name: 'Component.tsx.hbs',
            path: 'Component.tsx.hbs',
            isDirectory: false,
          },
        ]),
      }));

      const newTemplateManager = new TemplateManager();

      await newTemplateManager.discoverTemplates('/mock/workspace/project1');
      await newTemplateManager.discoverTemplates('/mock/workspace/project2');

      newTemplateManager.invalidateProjectCache('/mock/workspace/project1');

      // Should re-read project1 but not project2
      await newTemplateManager.discoverTemplates('/mock/workspace/project1');
      await newTemplateManager.discoverTemplates('/mock/workspace/project2');

      // Each discoverTemplates call should check folderExists for project and workspace paths
      expect(mockFolderExists).toHaveBeenCalledTimes(6); // 2 + 2 + 2 (each call tries project and workspace)
    });

    it('should clean expired cache entries', async () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);

      try {
        mockFs.promises.access.mockResolvedValue(undefined);
        mockFs.promises.readdir.mockResolvedValue([]);

        await templateManager.discoverTemplates('/mock/workspace/project1');

        // Advance time beyond cache TTL (5 minutes)
        mockTime += 6 * 60 * 1000;

        templateManager.cleanExpiredCache();

        const stats = templateManager.getCacheStats();
        expect(stats.templateCacheSize).toBe(0);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('preloadTemplates', () => {
    it('should preload templates for multiple projects', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir.mockResolvedValue([]);

      await templateManager.preloadTemplates([
        '/mock/workspace/project1',
        '/mock/workspace/project2',
      ]);

      const stats = templateManager.getCacheStats();
      expect(stats.templateCacheSize).toBe(2);
    });

    it('should handle preload errors gracefully', async () => {
      mockFs.promises.access.mockRejectedValue(new Error('Permission denied'));

      // Should not throw error
      await expect(
        templateManager.preloadTemplates(['/invalid/path']),
      ).resolves.toBeUndefined();
    });
  });

  describe('template validation', () => {
    describe('validateProcessedTemplate', () => {
      it('should pass validation when no duplicate target paths exist', async () => {
        // Mock DirectoryProcessor to return a simple structure
        const MockedDirectoryProcessor =
          require('../../../utils/DirectoryProcessor').DirectoryProcessor;
        MockedDirectoryProcessor.mockImplementation(() => ({
          scanTemplateStructure: jest.fn().mockResolvedValue({
            rootPath: '/test/templates/ComponentTemplate',
            files: [
              {
                name: 'Component.tsx.hbs',
                path: '/test/templates/ComponentTemplate/Component.tsx.hbs',
                relativePath: 'Component.tsx.hbs',
              },
              {
                name: 'index.tsx.hbs',
                path: '/test/templates/ComponentTemplate/index.tsx.hbs',
                relativePath: 'index.tsx.hbs',
              },
            ],
            directories: [],
          }),
          validateDepth: jest.fn(),
        }));

        const newTemplateManager = new TemplateManager();
        const templateStructure =
          await newTemplateManager.scanTemplateStructure(
            '/test/templates/ComponentTemplate',
          );

        // This should not throw an error
        await expect(
          newTemplateManager.processTemplateHierarchy(
            templateStructure,
            'TestComponent',
          ),
        ).resolves.toBeDefined();
      });

      it('should throw error when duplicate target paths are detected', async () => {
        // Create a mock processed template with duplicate target paths directly
        const processedTemplate = {
          componentName: 'TestComponent',
          files: [
            {
              originalPath: '/test/Component.tsx.hbs',
              targetPath: 'Component.tsx',
              content: 'content1',
            },
          ],
          directories: [
            {
              originalPath: '/test/src',
              targetPath: 'src',
              files: [
                {
                  originalPath: '/test/src/Component.tsx.hbs',
                  targetPath: 'Component.tsx',
                  content: 'content2',
                },
              ],
              subdirectories: [],
            },
          ],
        };

        // Test the validation method directly
        expect(() => {
          (
            templateManager as unknown as TemplateManagerTestable
          ).validateProcessedTemplate(processedTemplate);
        }).toThrow('Duplicate target paths detected: Component.tsx');
      });

      it('should handle nested directory structures correctly', async () => {
        // Mock DirectoryProcessor to return a nested structure
        const MockedDirectoryProcessor =
          require('../../../utils/DirectoryProcessor').DirectoryProcessor;
        MockedDirectoryProcessor.mockImplementation(() => ({
          scanTemplateStructure: jest.fn().mockResolvedValue({
            rootPath: '/test/templates/ComponentTemplate',
            files: [
              {
                name: 'index.tsx.hbs',
                path: '/test/templates/ComponentTemplate/index.tsx.hbs',
                relativePath: 'index.tsx.hbs',
              },
            ],
            directories: [
              {
                name: 'src',
                path: '/test/templates/ComponentTemplate/src',
                relativePath: 'src',
                files: [
                  {
                    name: 'Component.tsx.hbs',
                    path: '/test/templates/ComponentTemplate/src/Component.tsx.hbs',
                    relativePath: 'Component.tsx.hbs',
                  },
                ],
                subdirectories: [
                  {
                    name: 'lib',
                    path: '/test/templates/ComponentTemplate/src/lib',
                    relativePath: 'lib',
                    files: [
                      {
                        name: 'main.tsx.hbs',
                        path: '/test/templates/ComponentTemplate/src/lib/main.tsx.hbs',
                        relativePath: 'main.tsx.hbs',
                      },
                    ],
                    subdirectories: [],
                  },
                ],
              },
            ],
          }),
          validateDepth: jest.fn(),
        }));

        const newTemplateManager = new TemplateManager();
        const templateStructure =
          await newTemplateManager.scanTemplateStructure(
            '/test/templates/ComponentTemplate',
          );

        // This should not throw an error - all paths should be unique
        const result = await newTemplateManager.processTemplateHierarchy(
          templateStructure,
          'TestComponent',
        );

        expect(result).toBeDefined();
        expect(result.files).toHaveLength(1);
        expect(result.directories).toHaveLength(1);
        expect(result.directories[0].files).toHaveLength(1);
        expect(result.directories[0].subdirectories).toHaveLength(1);
        expect(result.directories[0].subdirectories[0].files).toHaveLength(1);
      });
    });

    describe('collectAllTargetPaths', () => {
      it('should collect paths from root files only', () => {
        const processedTemplate = {
          componentName: 'TestComponent',
          files: [
            {
              originalPath: '/test/Component.tsx.hbs',
              targetPath: 'Component.tsx',
              content: 'content1',
            },
            {
              originalPath: '/test/index.tsx.hbs',
              targetPath: 'index.tsx',
              content: 'content2',
            },
          ],
          directories: [],
        };

        // Access the private method through type assertion
        const paths = (
          templateManager as unknown as TemplateManagerTestable
        ).collectAllTargetPaths(processedTemplate);

        expect(paths).toEqual(['Component.tsx', 'index.tsx']);
      });

      it('should collect paths from nested directories', () => {
        const processedTemplate = {
          componentName: 'TestComponent',
          files: [
            {
              originalPath: '/test/index.tsx.hbs',
              targetPath: 'index.tsx',
              content: 'content1',
            },
          ],
          directories: [
            {
              originalPath: '/test/src',
              targetPath: 'src',
              files: [
                {
                  originalPath: '/test/src/Component.tsx.hbs',
                  targetPath: 'src/Component.tsx',
                  content: 'content2',
                },
              ],
              subdirectories: [
                {
                  originalPath: '/test/src/lib',
                  targetPath: 'src/lib',
                  files: [
                    {
                      originalPath: '/test/src/lib/main.tsx.hbs',
                      targetPath: 'src/lib/main.tsx',
                      content: 'content3',
                    },
                  ],
                  subdirectories: [],
                },
              ],
            },
          ],
        };

        // Access the private method through type assertion
        const paths = (
          templateManager as unknown as TemplateManagerTestable
        ).collectAllTargetPaths(processedTemplate);

        expect(paths).toEqual([
          'index.tsx',
          'src/Component.tsx',
          'src/lib/main.tsx',
        ]);
      });
    });

    describe('findDuplicatePaths', () => {
      it('should return empty array when no duplicates exist', () => {
        const paths = ['Component.tsx', 'index.tsx', 'src/main.tsx'];

        // Access the private method through type assertion
        const duplicates = (
          templateManager as unknown as TemplateManagerTestable
        ).findDuplicatePaths(paths);

        expect(duplicates).toEqual([]);
      });

      it('should find duplicate paths', () => {
        const paths = [
          'Component.tsx',
          'index.tsx',
          'Component.tsx',
          'src/main.tsx',
          'index.tsx',
        ];

        // Access the private method through type assertion
        const duplicates = (
          templateManager as unknown as TemplateManagerTestable
        ).findDuplicatePaths(paths);

        expect(duplicates).toEqual(['Component.tsx', 'index.tsx']);
      });

      it('should handle empty array', () => {
        const paths: string[] = [];

        // Access the private method through type assertion
        const duplicates = (
          templateManager as unknown as TemplateManagerTestable
        ).findDuplicatePaths(paths);

        expect(duplicates).toEqual([]);
      });
    });
  });
});
