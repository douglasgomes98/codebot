import * as path from 'path';
import { ConfigurationManager } from '../../../managers/ConfigurationManager';
import { ConfigurationFile } from '../../../types';
import { CodebotError } from '../../../errors';
import { DEFAULT_CONFIGURATION } from '../../../constants';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  },
  readFileSync: jest.fn()
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

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  const mockFs = require('fs');

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigurationManager();
  });

  describe('getConfiguration', () => {
    it('should return project-specific configuration when available', async () => {
      const projectConfig: ConfigurationFile = {
        templateFolderPath: 'custom-templates',
        multiProject: {
          enabled: false,
          projectDetection: 'manual'
        }
      };

      mockFs.promises.readFile.mockResolvedValueOnce(JSON.stringify(projectConfig));

      const result = await configManager.getConfiguration('/mock/workspace/project1');

      expect(result).toEqual(projectConfig);
      expect(mockFs.promises.readFile).toHaveBeenCalledWith(
        '/mock/workspace/project1/codebot.config.json',
        'utf8'
      );
    });

    it('should fallback to workspace configuration when project config not found', async () => {
      const workspaceConfig: ConfigurationFile = {
        templateFolderPath: 'shared-templates'
      };

      mockFs.promises.readFile
        .mockRejectedValueOnce(new Error('File not found')) // Project config
        .mockResolvedValueOnce(JSON.stringify(workspaceConfig)); // Workspace config

      const result = await configManager.getConfiguration('/mock/workspace/project1');

      expect(result.templateFolderPath).toBe('shared-templates');
    });

    it('should use default configuration when no config files found', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const result = await configManager.getConfiguration('/mock/workspace/project1');

      expect(result).toEqual(DEFAULT_CONFIGURATION);
    });

    it('should merge configurations hierarchically', async () => {
      const workspaceConfig: ConfigurationFile = {
        templateFolderPath: 'workspace-templates',
        multiProject: {
          enabled: true,
          projectDetection: 'auto'
        }
      };

      const projectConfig: Partial<ConfigurationFile> = {
        templateFolderPath: 'project-templates'
        // multiProject not specified, should inherit from workspace
      };

      mockFs.promises.readFile
        .mockResolvedValueOnce(JSON.stringify(projectConfig)) // Project config
        .mockResolvedValueOnce(JSON.stringify(workspaceConfig)); // Workspace config

      const result = await configManager.getConfiguration('/mock/workspace/project1');

      expect(result).toEqual({
        templateFolderPath: 'project-templates', // From project config
        multiProject: {
          enabled: true,
          projectDetection: 'auto'
        } // From workspace config
      });
    });

    it('should cache configuration results', async () => {
      const config: ConfigurationFile = { templateFolderPath: 'templates' };
      mockFs.promises.readFile.mockResolvedValueOnce(JSON.stringify(config));

      const result1 = await configManager.getConfiguration('/mock/workspace/project1');
      const result2 = await configManager.getConfiguration('/mock/workspace/project1');

      expect(result1).toBe(result2); // Should be same object reference
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1); // Should only read once
    });

    it('should throw CodebotError on configuration error', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('Permission denied'));
      
      // Mock JSON.parse to throw error
      const originalParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      try {
        await expect(configManager.getConfiguration('/mock/workspace/project1'))
          .rejects
          .toThrow(CodebotError);
      } finally {
        JSON.parse = originalParse;
      }
    });
  });

  describe('resolveTemplatePath', () => {
    it('should resolve template path using configuration', () => {
      const config: ConfigurationFile = { templateFolderPath: 'custom-templates' };
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(config));

      const result = configManager.resolveTemplatePath('/mock/workspace/project1');

      expect(result).toBe(path.resolve('/mock/workspace/project1', 'custom-templates'));
    });

    it('should use default template folder when config not found', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = configManager.resolveTemplatePath('/mock/workspace/project1');

      expect(result).toBe(path.resolve('/mock/workspace/project1', 'templates'));
    });
  });

  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const validConfig: ConfigurationFile = {
        templateFolderPath: 'templates',
        multiProject: {
          enabled: true,
          projectDetection: 'auto'
        }
      };

      expect(configManager.validateConfiguration(validConfig)).toBe(true);
    });

    it('should reject invalid templateFolderPath', () => {
      const invalidConfig = {
        templateFolderPath: 123 // Should be string
      } as any;

      expect(configManager.validateConfiguration(invalidConfig)).toBe(false);
    });

    it('should reject invalid multiProject.projectDetection', () => {
      const invalidConfig: ConfigurationFile = {
        multiProject: {
          enabled: true,
          projectDetection: 'invalid' as any
        }
      };

      expect(configManager.validateConfiguration(invalidConfig)).toBe(false);
    });
  });

  describe('createDefaultConfiguration', () => {
    it('should create default configuration file', async () => {
      await configManager.createDefaultConfiguration('/mock/workspace/project1');

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        '/mock/workspace/project1/codebot.config.json',
        expect.stringContaining('"templateFolderPath": "templates"'),
        'utf8'
      );
    });

    it('should invalidate cache after creating configuration', async () => {
      // First, cache a configuration
      mockFs.promises.readFile.mockResolvedValueOnce('{}');
      await configManager.getConfiguration('/mock/workspace/project1');

      // Create default configuration
      await configManager.createDefaultConfiguration('/mock/workspace/project1');

      // Next call should read from file again (cache invalidated)
      mockFs.promises.readFile.mockResolvedValueOnce('{"templateFolderPath": "new-templates"}');
      await configManager.getConfiguration('/mock/workspace/project1');

      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache management', () => {
    it('should clear all cache', async () => {
      mockFs.promises.readFile.mockResolvedValue('{}');
      
      await configManager.getConfiguration('/mock/workspace/project1');
      await configManager.getConfiguration('/mock/workspace/project2');
      
      configManager.clearCache();
      
      // Next calls should read from file again
      await configManager.getConfiguration('/mock/workspace/project1');
      
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(3);
    });

    it('should invalidate specific configuration', async () => {
      mockFs.promises.readFile.mockResolvedValue('{}');
      
      await configManager.getConfiguration('/mock/workspace/project1');
      await configManager.getConfiguration('/mock/workspace/project2');
      
      configManager.invalidateConfiguration('/mock/workspace/project1');
      
      // Only project1 should be re-read
      await configManager.getConfiguration('/mock/workspace/project1');
      await configManager.getConfiguration('/mock/workspace/project2');
      
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(3); // 2 initial + 1 re-read
    });
  });
});