import * as path from 'path';
import { TemplateManager } from '../../../managers/TemplateManager';
import { TemplateType } from '../../../types';
import { CodebotError } from '../../../errors';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn()
  },
  readFileSync: jest.fn(),
  readdirSync: jest.fn()
}));

// Mock handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn()
}));

// Mock vscode module
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/mock/workspace'
        }
      }
    ]
  }
}));

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  const mockFs = require('fs');
  const mockHandlebars = require('handlebars');

  beforeEach(() => {
    jest.clearAllMocks();
    templateManager = new TemplateManager();
  });

  describe('discoverTemplates', () => {
    it('should discover templates in project directory', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir
        .mockResolvedValueOnce([
          { name: 'ComponentSass', isDirectory: () => true },
          { name: 'ComponentStyled', isDirectory: () => true }
        ])
        .mockResolvedValueOnce(['Component.tsx.hbs', 'index.tsx.hbs'])
        .mockResolvedValueOnce(['index.tsx.hbs', 'styles.ts.hbs']);

      const templates = await templateManager.discoverTemplates('/mock/workspace/project1');

      expect(templates).toHaveLength(2);
      expect(templates[0]).toEqual({
        name: 'ComponentSass',
        path: '/mock/workspace/project1/templates/ComponentSass',
        files: ['Component.tsx.hbs', 'index.tsx.hbs']
      });
      expect(templates[1]).toEqual({
        name: 'ComponentStyled',
        path: '/mock/workspace/project1/templates/ComponentStyled',
        files: ['index.tsx.hbs', 'styles.ts.hbs']
      });
    });

    it('should fallback to workspace templates when project templates not found', async () => {
      mockFs.promises.access
        .mockRejectedValueOnce(new Error('Not found')) // Project templates
        .mockResolvedValueOnce(undefined); // Workspace templates

      mockFs.promises.readdir
        .mockResolvedValueOnce([
          { name: 'SharedComponent', isDirectory: () => true }
        ])
        .mockResolvedValueOnce(['Component.tsx.hbs']);

      const templates = await templateManager.discoverTemplates('/mock/workspace/project1');

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('SharedComponent');
      expect(templates[0].path).toBe('/mock/workspace/templates/SharedComponent');
    });

    it('should prioritize project templates over workspace templates', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir
        .mockResolvedValueOnce([
          { name: 'Component', isDirectory: () => true }
        ]) // Project templates
        .mockResolvedValueOnce(['project.tsx.hbs']) // Project Component files
        .mockResolvedValueOnce([
          { name: 'Component', isDirectory: () => true },
          { name: 'OtherComponent', isDirectory: () => true }
        ]) // Workspace templates
        .mockResolvedValueOnce(['workspace.tsx.hbs']) // Workspace Component files
        .mockResolvedValueOnce(['other.tsx.hbs']); // OtherComponent files

      const templates = await templateManager.discoverTemplates('/mock/workspace/project1');

      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('Component');
      expect(templates[0].files).toEqual(['project.tsx.hbs']); // Project version wins
      expect(templates[1].name).toBe('OtherComponent');
    });

    it('should cache template discovery results', async () => {
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const templates1 = await templateManager.discoverTemplates('/mock/workspace/project1');
      const templates2 = await templateManager.discoverTemplates('/mock/workspace/project1');

      expect(templates1).toBe(templates2); // Should be same object reference
      expect(mockFs.promises.readdir).toHaveBeenCalledTimes(2); // Should only read once
    });

    it('should handle template discovery errors', async () => {
      mockFs.promises.access.mockRejectedValue(new Error('Permission denied'));
      mockFs.promises.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(templateManager.discoverTemplates('/invalid/path'))
        .rejects
        .toThrow(CodebotError);
    });
  });

  describe('processTemplate', () => {
    it('should compile and process template with component name', () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      mockFs.readFileSync.mockReturnValue('template content');

      const result = templateManager.processTemplate('/path/to/template.hbs', 'myComponent');

      expect(mockHandlebars.compile).toHaveBeenCalledWith('template content');
      expect(mockTemplate).toHaveBeenCalledWith({ name: 'MyComponent' });
      expect(result).toBe('processed content');
    });

    it('should format component name to PascalCase', () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      mockFs.readFileSync.mockReturnValue('template content');

      templateManager.processTemplate('/path/to/template.hbs', 'my-component-name');

      expect(mockTemplate).toHaveBeenCalledWith({ name: 'MyComponentName' });
    });

    it('should cache compiled templates', () => {
      const mockTemplate = jest.fn().mockReturnValue('processed content');
      mockHandlebars.compile.mockReturnValue(mockTemplate);
      mockFs.readFileSync.mockReturnValue('template content');

      templateManager.processTemplate('/path/to/template.hbs', 'component1');
      templateManager.processTemplate('/path/to/template.hbs', 'component2');

      expect(mockHandlebars.compile).toHaveBeenCalledTimes(1); // Should compile only once
      expect(mockTemplate).toHaveBeenCalledTimes(2); // Should execute twice
    });

    it('should handle template processing errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => templateManager.processTemplate('/invalid/template.hbs', 'component'))
        .toThrow(CodebotError);
    });
  });

  describe('getTemplateFiles', () => {
    it('should return only .hbs files', () => {
      mockFs.readdirSync.mockReturnValue([
        'Component.tsx.hbs',
        'Component.scss.hbs',
        'index.tsx.hbs',
        'README.md',
        'package.json'
      ]);

      const files = templateManager.getTemplateFiles('/path/to/template');

      expect(files).toEqual([
        'Component.tsx.hbs',
        'Component.scss.hbs',
        'index.tsx.hbs'
      ]);
    });

    it('should handle directory read errors', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => templateManager.getTemplateFiles('/invalid/path'))
        .toThrow(CodebotError);
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
      mockFs.promises.access.mockResolvedValue(undefined);
      mockFs.promises.readdir.mockResolvedValue([]);

      await templateManager.discoverTemplates('/mock/workspace/project1');
      await templateManager.discoverTemplates('/mock/workspace/project2');

      templateManager.invalidateProjectCache('/mock/workspace/project1');

      // Should re-read project1 but not project2
      await templateManager.discoverTemplates('/mock/workspace/project1');
      await templateManager.discoverTemplates('/mock/workspace/project2');

      expect(mockFs.promises.readdir).toHaveBeenCalledTimes(3); // 2 initial + 1 re-read
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
        '/mock/workspace/project2'
      ]);

      const stats = templateManager.getCacheStats();
      expect(stats.templateCacheSize).toBe(2);
    });

    it('should handle preload errors gracefully', async () => {
      mockFs.promises.access.mockRejectedValue(new Error('Permission denied'));

      // Should not throw error
      await expect(templateManager.preloadTemplates(['/invalid/path']))
        .resolves
        .toBeUndefined();
    });
  });
});