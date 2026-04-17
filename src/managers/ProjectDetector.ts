import * as path from 'path';
import * as vscode from 'vscode';
import { IProjectDetector, ProjectContext } from '../types';
import { CodebotError } from '../errors';
import { DEFAULT_TEMPLATE_FOLDER, CONFIG_FILE_NAME } from '../constants';

export class ProjectDetector implements IProjectDetector {
  private workspaceRoot: string;
  private projectCache = new Map<string, ProjectContext>();

  constructor() {
    this.workspaceRoot = this.getWorkspaceRoot();
  }

  async detectProject(folderPath: string): Promise<ProjectContext> {
    try {
      // Check cache first
      const cacheKey = this.normalizePath(folderPath);
      if (this.projectCache.has(cacheKey)) {
        return this.projectCache.get(cacheKey)!;
      }

      const projectRoot = this.resolveProjectRoot(folderPath);
      const isMultiProject = this.isMultiProjectWorkspace();
      
      const context: ProjectContext = {
        workspaceRoot: this.workspaceRoot,
        projectRoot,
        templatePath: this.resolveTemplatePath(projectRoot),
        configPath: this.resolveConfigPath(projectRoot),
        isMultiProject,
        projectName: isMultiProject ? path.basename(projectRoot) : undefined
      };

      // Cache the result
      this.projectCache.set(cacheKey, context);
      return context;
    } catch (error) {
      throw CodebotError.projectDetectionError(folderPath, error as Error);
    }
  }

  isMultiProjectWorkspace(): boolean {
    if (!vscode.workspace.workspaceFolders) {
      return false;
    }

    // If there are multiple workspace folders, it's definitely multi-project
    if (vscode.workspace.workspaceFolders.length > 1) {
      return true;
    }

    // Check if the single workspace contains multiple project-like folders
    return this.detectSubProjects();
  }

  resolveProjectRoot(folderPath: string): string {
    const normalizedPath = this.normalizePath(folderPath);
    
    // If it's a multi-project workspace, find the nearest project root
    if (this.isMultiProjectWorkspace()) {
      return this.findNearestProjectRoot(normalizedPath);
    }

    // For single project, the workspace root is the project root
    return this.workspaceRoot;
  }

  private getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw CodebotError.workspaceNotFound();
    }
    return workspaceFolders[0].uri.fsPath;
  }

  private normalizePath(filePath: string): string {
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  private resolveTemplatePath(projectRoot: string): string {
    return path.join(projectRoot, DEFAULT_TEMPLATE_FOLDER);
  }

  private resolveConfigPath(projectRoot: string): string {
    return path.join(projectRoot, CONFIG_FILE_NAME);
  }

  private detectSubProjects(): boolean {
    try {
      const fs = require('fs');
      const workspaceContents = fs.readdirSync(this.workspaceRoot, { withFileTypes: true });
      
      // Look for multiple directories that could be projects
      const potentialProjects = workspaceContents
        .filter((dirent: any) => dirent.isDirectory())
        .filter((dirent: any) => !dirent.name.startsWith('.'))
        .filter((dirent: any) => this.looksLikeProject(path.join(this.workspaceRoot, dirent.name)));

      return potentialProjects.length > 1;
    } catch (error) {
      // If we can't read the workspace, assume single project
      return false;
    }
  }

  private looksLikeProject(dirPath: string): boolean {
    try {
      const fs = require('fs');
      const contents = fs.readdirSync(dirPath);
      
      // Check for common project indicators
      const projectIndicators = [
        'package.json',
        'tsconfig.json',
        'src',
        'lib',
        'templates',
        CONFIG_FILE_NAME
      ];

      return projectIndicators.some(indicator => contents.includes(indicator));
    } catch (error) {
      return false;
    }
  }

  private findNearestProjectRoot(folderPath: string): string {
    let currentPath = folderPath;
    
    // Walk up the directory tree until we find a project root or reach workspace root
    while (currentPath !== this.workspaceRoot && currentPath !== path.dirname(currentPath)) {
      if (this.looksLikeProject(currentPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    // If we reach workspace root and it looks like a project, use it
    if (this.looksLikeProject(this.workspaceRoot)) {
      return this.workspaceRoot;
    }

    // Otherwise, try to find the nearest sibling project
    const parentDir = path.dirname(folderPath);
    if (parentDir !== this.workspaceRoot) {
      return this.findNearestProjectRoot(parentDir);
    }

    // Fallback to workspace root
    return this.workspaceRoot;
  }

  // Method to clear cache when workspace changes
  clearCache(): void {
    this.projectCache.clear();
  }

  // Method to get all detected projects
  getAllProjects(): ProjectContext[] {
    return Array.from(this.projectCache.values());
  }
}