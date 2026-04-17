import { TemplateManager } from '../../../managers/TemplateManager';

type TemplateManagerTestable = {
  applyNamingRules(
    filePath: string,
    componentName: string,
    templateFolderName?: string,
  ): string;
  extractTemplateFolderName(templateRootPath: string): string | undefined;
};

// Mock FileSystemManager
jest.mock('../../../managers/FileSystemManager', () => ({
  FileSystemManager: jest.fn().mockImplementation(() => ({
    folderExists: jest.fn().mockResolvedValue(true),
    listDirectories: jest.fn().mockResolvedValue([]),
    listFiles: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
    listFilesRecursive: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock DirectoryProcessor
jest.mock('../../../utils/DirectoryProcessor', () => ({
  DirectoryProcessor: jest.fn().mockImplementation(() => ({
    scanTemplateStructure: jest.fn().mockResolvedValue({
      rootPath: '/test/templates/ComponentSass',
      files: [],
      directories: [],
    }),
    validateDepth: jest.fn(),
  })),
}));

describe('TemplateManager - New Naming Rules', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    jest.clearAllMocks();
    templateManager = new TemplateManager();
  });

  describe('applyNamingRules with template folder name', () => {
    it('should replace file name starting with template folder name', () => {
      // Access the private method for testing
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules(
        'ComponentSass.stories.tsx',
        'Page',
        'ComponentSass',
      );
      expect(result).toBe('Page.stories.tsx');
    });

    it('should replace file name with different component name', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules(
        'ComponentSass.module.scss',
        'UserProfile',
        'ComponentSass',
      );
      expect(result).toBe('UserProfile.module.scss');
    });

    it('should handle case insensitive matching', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules(
        'componentsass.test.tsx',
        'Page',
        'ComponentSass',
      );
      expect(result).toBe('Page.test.tsx');
    });

    it('should not change files that do not start with template folder name', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules('index.tsx', 'Page', 'ComponentSass');
      expect(result).toBe('index.tsx');
    });

    it('should preserve existing template/Template replacement functionality', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules(
        'template.config.js',
        'Page',
        'ComponentSass',
      );
      expect(result).toBe('page.config.js');
    });

    it('should handle both template folder name and template keyword', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      // File starts with template folder name AND contains template keyword
      const result = applyNamingRules(
        'ComponentSass.template.tsx',
        'Page',
        'ComponentSass',
      );
      expect(result).toBe('Page.page.tsx');
    });

    it('should work without template folder name (fallback to existing behavior)', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result = applyNamingRules('ComponentSass.stories.tsx', 'Page');
      expect(result).toBe('ComponentSass.stories.tsx');
    });

    it('should handle empty or undefined template folder name', () => {
      const applyNamingRules = (
        templateManager as unknown as TemplateManagerTestable
      ).applyNamingRules.bind(templateManager);

      const result1 = applyNamingRules('ComponentSass.stories.tsx', 'Page', '');
      expect(result1).toBe('ComponentSass.stories.tsx');

      const result2 = applyNamingRules(
        'ComponentSass.stories.tsx',
        'Page',
        undefined,
      );
      expect(result2).toBe('ComponentSass.stories.tsx');
    });
  });

  describe('extractTemplateFolderName', () => {
    it('should extract folder name from Unix path', () => {
      const extractTemplateFolderName = (
        templateManager as unknown as TemplateManagerTestable
      ).extractTemplateFolderName.bind(templateManager);

      const result = extractTemplateFolderName(
        '/path/to/templates/ComponentSass',
      );
      expect(result).toBe('ComponentSass');
    });

    it('should extract folder name from Windows path', () => {
      const extractTemplateFolderName = (
        templateManager as unknown as TemplateManagerTestable
      ).extractTemplateFolderName.bind(templateManager);

      const result = extractTemplateFolderName(
        'C:\\templates\\ComponentStyled',
      );
      expect(result).toBe('ComponentStyled');
    });

    it('should extract folder name from relative path', () => {
      const extractTemplateFolderName = (
        templateManager as unknown as TemplateManagerTestable
      ).extractTemplateFolderName.bind(templateManager);

      const result = extractTemplateFolderName('ComponentSass');
      expect(result).toBe('ComponentSass');
    });

    it('should return undefined for invalid paths', () => {
      const extractTemplateFolderName = (
        templateManager as unknown as TemplateManagerTestable
      ).extractTemplateFolderName.bind(templateManager);

      const result1 = extractTemplateFolderName('');
      expect(result1).toBeUndefined();

      const result2 = extractTemplateFolderName('.');
      expect(result2).toBeUndefined();

      const result3 = extractTemplateFolderName('..');
      expect(result3).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const extractTemplateFolderName = (
        templateManager as unknown as TemplateManagerTestable
      ).extractTemplateFolderName.bind(templateManager);

      // This should not throw an error
      const result = extractTemplateFolderName(null as unknown as string);
      expect(result).toBeUndefined();
    });
  });

  describe('integration with processTemplateHierarchy', () => {
    it('should extract template folder name and pass it through the processing chain', async () => {
      // Mock DirectoryProcessor to return a structure with files
      const MockedDirectoryProcessor =
        require('../../../utils/DirectoryProcessor').DirectoryProcessor;
      MockedDirectoryProcessor.mockImplementation(() => ({
        scanTemplateStructure: jest.fn().mockResolvedValue({
          rootPath: '/test/templates/ComponentSass',
          files: [
            {
              name: 'ComponentSass.stories.tsx.hbs',
              path: '/test/templates/ComponentSass/ComponentSass.stories.tsx.hbs',
              relativePath: 'ComponentSass.stories.tsx.hbs',
            },
          ],
          directories: [],
        }),
        validateDepth: jest.fn(),
      }));

      const newTemplateManager = new TemplateManager();
      const templateStructure = await newTemplateManager.scanTemplateStructure(
        '/test/templates/ComponentSass',
      );
      const result = await newTemplateManager.processTemplateHierarchy(
        templateStructure,
        'Page',
      );

      expect(result.files).toHaveLength(1);
      expect(result.files[0].targetPath).toBe('Page.stories.tsx');
    });
  });
});
