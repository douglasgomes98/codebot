import * as path from 'node:path';
import * as vscode from 'vscode';
import { CodebotError } from '../../../errors';
import { ProjectDetector } from '../../../managers/ProjectDetector';

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

// Mock fs module
jest.mock('node:fs', () => ({
  readdirSync: jest.fn(),
}));

type WorkspaceMock = {
  workspaceFolders: Array<{ uri: { fsPath: string } }> | undefined;
};

describe('ProjectDetector', () => {
  let projectDetector: ProjectDetector;
  const mockFs = require('node:fs');
  const workspaceMock = vscode.workspace as unknown as WorkspaceMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset vscode mock to default state
    workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

    projectDetector = new ProjectDetector();
  });

  describe('detectProject', () => {
    it('should detect single project context', async () => {
      // Mock single workspace folder
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync.mockReturnValue([
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      const context = await projectDetector.detectProject(
        '/mock/workspace/src',
      );

      expect(context).toEqual({
        workspaceRoot: '/mock/workspace',
        projectRoot: '/mock/workspace',
        templatePath: path.join('/mock/workspace', 'templates'),
        configPath: path.join('/mock/workspace', 'codebot.config.json'),
        isMultiProject: false,
        projectName: undefined,
      });
    });

    it('should detect multi-project context', async () => {
      // Mock multiple workspace folders
      workspaceMock.workspaceFolders = [
        { uri: { fsPath: '/mock/workspace/project1' } },
        { uri: { fsPath: '/mock/workspace/project2' } },
      ];

      projectDetector = new ProjectDetector();
      const context = await projectDetector.detectProject(
        '/mock/workspace/project1/src',
      );

      expect(context.isMultiProject).toBe(true);
      expect(context.projectName).toBeDefined();
    });

    it('should cache project contexts', async () => {
      // Mock single workspace folder
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync.mockReturnValue([
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      const context1 = await projectDetector.detectProject(
        '/mock/workspace/src',
      );
      const context2 = await projectDetector.detectProject(
        '/mock/workspace/src',
      );

      expect(context1).toEqual(context2); // Should have the same content
    });

    it('should handle detection errors gracefully', async () => {
      // Mock workspace folders to be empty to trigger error
      workspaceMock.workspaceFolders = [];

      await expect(() => new ProjectDetector()).toThrow(CodebotError);
    });
  });

  describe('isMultiProjectWorkspace', () => {
    it('should return true for multiple workspace folders', () => {
      workspaceMock.workspaceFolders = [
        { uri: { fsPath: '/mock/workspace/project1' } },
        { uri: { fsPath: '/mock/workspace/project2' } },
      ];

      projectDetector = new ProjectDetector();
      expect(projectDetector.isMultiProjectWorkspace()).toBe(true);
    });

    it('should return false for single workspace folder with no sub-projects', () => {
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync.mockReturnValue([
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      expect(projectDetector.isMultiProjectWorkspace()).toBe(false);
    });

    it('should return true for single workspace with multiple sub-projects', () => {
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: 'project1', isDirectory: () => true },
          { name: 'project2', isDirectory: () => true },
        ])
        .mockReturnValue(['package.json']); // For looksLikeProject calls

      projectDetector = new ProjectDetector();
      expect(projectDetector.isMultiProjectWorkspace()).toBe(true);
    });
  });

  describe('resolveProjectRoot', () => {
    it('should return workspace root for single project', () => {
      mockFs.readdirSync.mockReturnValue([]);

      const projectRoot = projectDetector.resolveProjectRoot(
        '/mock/workspace/src/components',
      );
      expect(projectRoot).toBe('/mock/workspace');
    });

    it('should find nearest project root in multi-project workspace', () => {
      workspaceMock.workspaceFolders = [
        { uri: { fsPath: '/mock/workspace/project1' } },
        { uri: { fsPath: '/mock/workspace/project2' } },
      ];

      mockFs.readdirSync.mockReturnValue([
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      const projectRoot = projectDetector.resolveProjectRoot(
        '/mock/workspace/project1/src',
      );

      expect(projectRoot).toBe('/mock/workspace/project1');
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Mock single workspace folder
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync.mockReturnValue([
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      await projectDetector.detectProject('/mock/workspace/src');
      expect(projectDetector.getAllProjects()).toHaveLength(1);

      projectDetector.clearCache();
      expect(projectDetector.getAllProjects()).toHaveLength(0);
    });

    it('should return all cached projects', async () => {
      // Mock single workspace folder
      workspaceMock.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

      mockFs.readdirSync.mockReturnValue([
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
      ]);

      projectDetector = new ProjectDetector();
      await projectDetector.detectProject('/mock/workspace/src');
      await projectDetector.detectProject('/mock/workspace/lib');

      const projects = projectDetector.getAllProjects();
      expect(projects).toHaveLength(2);
    });
  });
});
