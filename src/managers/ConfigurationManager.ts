import * as path from 'path';
import { IConfigurationManager, ConfigurationFile } from '../types';
import { CodebotError } from '../errors';
import { DEFAULT_CONFIGURATION, CONFIG_FILE_NAME, DEFAULT_TEMPLATE_FOLDER } from '../constants';

export class ConfigurationManager implements IConfigurationManager {
  private configCache = new Map<string, ConfigurationFile>();

  async getConfiguration(projectPath: string): Promise<ConfigurationFile> {
    try {
      // Check cache first
      const cacheKey = this.normalizePath(projectPath);
      if (this.configCache.has(cacheKey)) {
        return this.configCache.get(cacheKey)!;
      }

      // Try hierarchical configuration resolution
      const config = await this.resolveHierarchicalConfiguration(projectPath);
      
      // Cache the result
      this.configCache.set(cacheKey, config);
      return config;
    } catch (error) {
      throw CodebotError.configurationError(projectPath, error as Error);
    }
  }

  resolveTemplatePath(projectPath: string): string {
    const configPath = this.getConfigurationPath(projectPath);
    const config = this.loadConfigurationSync(configPath);
    
    const templateFolder = config?.templateFolderPath || DEFAULT_TEMPLATE_FOLDER;
    return path.resolve(projectPath, templateFolder);
  }

  getConfigurationPath(projectPath: string): string {
    return path.join(projectPath, CONFIG_FILE_NAME);
  }

  private async resolveHierarchicalConfiguration(projectPath: string): Promise<ConfigurationFile> {
    const configurations: Partial<ConfigurationFile>[] = [];

    // 1. Try project-specific configuration
    const projectConfig = await this.loadConfiguration(projectPath);
    if (projectConfig) {
      configurations.push(projectConfig);
    }

    // 2. Try workspace root configuration (if different from project)
    const workspaceRoot = this.findWorkspaceRoot(projectPath);
    if (workspaceRoot && workspaceRoot !== projectPath) {
      const workspaceConfig = await this.loadConfiguration(workspaceRoot);
      if (workspaceConfig) {
        configurations.push(workspaceConfig);
      }
    }

    // 3. Use default configuration as fallback
    configurations.push(DEFAULT_CONFIGURATION);

    // Merge configurations (project takes precedence over workspace, workspace over default)
    return this.mergeConfigurations(configurations);
  }

  private async loadConfiguration(configPath: string): Promise<ConfigurationFile | null> {
    try {
      const fs = require('fs').promises;
      const fullPath = path.join(configPath, CONFIG_FILE_NAME);
      
      const configContent = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(configContent) as ConfigurationFile;
    } catch (error) {
      // Configuration file doesn't exist or is invalid
      return null;
    }
  }

  private loadConfigurationSync(configPath: string): ConfigurationFile | null {
    try {
      const fs = require('fs');
      const fullPath = path.join(configPath, CONFIG_FILE_NAME);
      
      const configContent = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(configContent) as ConfigurationFile;
    } catch (error) {
      return null;
    }
  }

  private mergeConfigurations(configurations: Partial<ConfigurationFile>[]): ConfigurationFile {
    const merged: ConfigurationFile = {
      templateFolderPath: DEFAULT_TEMPLATE_FOLDER,
      multiProject: {
        enabled: true,
        projectDetection: 'auto'
      }
    };

    // Merge from least specific to most specific (reverse order)
    for (const config of configurations.reverse()) {
      if (config.templateFolderPath !== undefined) {
        merged.templateFolderPath = config.templateFolderPath;
      }
      
      if (config.multiProject) {
        merged.multiProject = {
          ...merged.multiProject,
          ...config.multiProject
        };
      }
    }

    return merged;
  }

  private findWorkspaceRoot(projectPath: string): string | null {
    // This is a simplified implementation
    // In a real scenario, you'd use VS Code's workspace API
    const vscode = require('vscode');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }

    // Find the workspace folder that contains the project path
    for (const folder of workspaceFolders) {
      const workspaceRoot = folder.uri.fsPath;
      if (projectPath.startsWith(workspaceRoot)) {
        return workspaceRoot;
      }
    }

    return workspaceFolders[0].uri.fsPath;
  }

  private normalizePath(filePath: string): string {
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  // Method to clear cache when configurations change
  clearCache(): void {
    this.configCache.clear();
  }

  // Method to invalidate specific configuration
  invalidateConfiguration(projectPath: string): void {
    const cacheKey = this.normalizePath(projectPath);
    this.configCache.delete(cacheKey);
  }

  // Method to validate configuration
  validateConfiguration(config: ConfigurationFile): boolean {
    try {
      // Basic validation
      if (config.templateFolderPath && typeof config.templateFolderPath !== 'string') {
        return false;
      }

      if (config.multiProject) {
        if (typeof config.multiProject.enabled !== 'boolean') {
          return false;
        }
        
        if (!['auto', 'manual'].includes(config.multiProject.projectDetection)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Method to create default configuration file
  async createDefaultConfiguration(projectPath: string): Promise<void> {
    try {
      const fs = require('fs').promises;
      const configPath = this.getConfigurationPath(projectPath);
      
      const defaultConfig = {
        templateFolderPath: DEFAULT_TEMPLATE_FOLDER,
        multiProject: {
          enabled: true,
          projectDetection: 'auto'
        }
      };

      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      
      // Invalidate cache for this path
      this.invalidateConfiguration(projectPath);
    } catch (error) {
      throw CodebotError.configurationError(projectPath, error as Error);
    }
  }
}