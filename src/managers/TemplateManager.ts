import * as path from 'path';
import * as handlebars from 'handlebars';
import { ITemplateManager, TemplateType, ProjectContext } from '../types';
import { CodebotError } from '../errors';
import { TEMPLATE_FILE_EXTENSION, DEFAULT_TEMPLATE_FOLDER } from '../constants';
import { ValidationUtils } from '../utils/validation';

interface TemplateCache {
  templates: TemplateType[];
  timestamp: number;
  projectPath: string;
}

interface CompiledTemplateCache {
  compiled: HandlebarsTemplateDelegate;
  timestamp: number;
}

export class TemplateManager implements ITemplateManager {
  private templateCache = new Map<string, TemplateCache>();
  private compiledCache = new Map<string, CompiledTemplateCache>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async discoverTemplates(projectPath: string): Promise<TemplateType[]> {
    try {
      // Check cache first
      const cacheKey = this.normalizePath(projectPath);
      const cached = this.templateCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.templates;
      }

      // Discover templates hierarchically
      const templates = await this.discoverTemplatesHierarchically(projectPath);
      
      // Cache the results
      this.templateCache.set(cacheKey, {
        templates,
        timestamp: Date.now(),
        projectPath
      });

      return templates;
    } catch (error) {
      throw CodebotError.templateProcessingError(projectPath, error as Error);
    }
  }

  processTemplate(templatePath: string, componentName: string): string {
    try {
      // Check compiled cache first
      const cacheKey = `${templatePath}:${componentName}`;
      const cached = this.compiledCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.compiled({ name: this.formatComponentName(componentName) });
      }

      // Read and compile template
      const templateContent = this.readTemplateFile(templatePath);
      const compiled = handlebars.compile(templateContent);
      
      // Cache compiled template
      this.compiledCache.set(templatePath, {
        compiled,
        timestamp: Date.now()
      });

      return compiled({ name: this.formatComponentName(componentName) });
    } catch (error) {
      throw CodebotError.templateProcessingError(templatePath, error as Error);
    }
  }

  getTemplateFiles(templateType: string): string[] {
    try {
      const fs = require('fs');
      const files = fs.readdirSync(templateType);
      
      return files.filter((file: string) => ValidationUtils.isTemplateFile(file));
    } catch (error) {
      throw CodebotError.templateProcessingError(templateType, error as Error);
    }
  }

  invalidateCache(): void {
    this.templateCache.clear();
    this.compiledCache.clear();
  }

  private async discoverTemplatesHierarchically(projectPath: string): Promise<TemplateType[]> {
    const templatePaths = this.getTemplatePaths(projectPath);
    const allTemplates: TemplateType[] = [];
    const seenTemplates = new Set<string>();

    // Search in order of priority: project -> workspace -> default
    for (const templatePath of templatePaths) {
      const templates = await this.discoverTemplatesInPath(templatePath);
      
      // Add only unique templates (by name)
      for (const template of templates) {
        if (!seenTemplates.has(template.name)) {
          allTemplates.push(template);
          seenTemplates.add(template.name);
        }
      }
    }

    return allTemplates;
  }

  private getTemplatePaths(projectPath: string): string[] {
    const paths: string[] = [];
    
    // 1. Project-specific templates
    const projectTemplatePath = path.join(projectPath, DEFAULT_TEMPLATE_FOLDER);
    paths.push(projectTemplatePath);

    // 2. Workspace root templates (if different from project)
    const workspaceRoot = this.findWorkspaceRoot(projectPath);
    if (workspaceRoot && workspaceRoot !== projectPath) {
      const workspaceTemplatePath = path.join(workspaceRoot, DEFAULT_TEMPLATE_FOLDER);
      paths.push(workspaceTemplatePath);
    }

    return paths;
  }

  private async discoverTemplatesInPath(templatePath: string): Promise<TemplateType[]> {
    try {
      const fs = require('fs').promises;
      
      // Check if template directory exists
      try {
        await fs.access(templatePath);
      } catch {
        return []; // Directory doesn't exist
      }

      const entries = await fs.readdir(templatePath, { withFileTypes: true });
      const templates: TemplateType[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const templateTypePath = path.join(templatePath, entry.name);
          const files = await this.getTemplateFilesInDirectory(templateTypePath);
          
          if (files.length > 0) {
            templates.push({
              name: entry.name,
              path: templateTypePath,
              files
            });
          }
        }
      }

      return templates;
    } catch (error) {
      // If we can't read the directory, return empty array
      return [];
    }
  }

  private async getTemplateFilesInDirectory(directoryPath: string): Promise<string[]> {
    try {
      const fs = require('fs').promises;
      const files = await fs.readdir(directoryPath);
      
      return files.filter((file: string) => ValidationUtils.isTemplateFile(file));
    } catch (error) {
      return [];
    }
  }

  private readTemplateFile(templatePath: string): string {
    try {
      const fs = require('fs');
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read template file: ${templatePath}`);
    }
  }

  private formatComponentName(componentName: string): string {
    // Convert to PascalCase
    return componentName
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private findWorkspaceRoot(projectPath: string): string | null {
    try {
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
    } catch (error) {
      return null;
    }
  }

  private normalizePath(filePath: string): string {
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  // Method to get cache statistics
  getCacheStats(): { templateCacheSize: number; compiledCacheSize: number } {
    return {
      templateCacheSize: this.templateCache.size,
      compiledCacheSize: this.compiledCache.size
    };
  }

  // Method to clean expired cache entries
  cleanExpiredCache(): void {
    const now = Date.now();
    
    // Clean template cache
    for (const [key, cache] of this.templateCache.entries()) {
      if (!this.isCacheValid(cache.timestamp)) {
        this.templateCache.delete(key);
      }
    }

    // Clean compiled cache
    for (const [key, cache] of this.compiledCache.entries()) {
      if (!this.isCacheValid(cache.timestamp)) {
        this.compiledCache.delete(key);
      }
    }
  }

  // Method to invalidate cache for specific project
  invalidateProjectCache(projectPath: string): void {
    const cacheKey = this.normalizePath(projectPath);
    this.templateCache.delete(cacheKey);
    
    // Also clear compiled templates that might be from this project
    for (const [key, cache] of this.compiledCache.entries()) {
      if (key.startsWith(projectPath)) {
        this.compiledCache.delete(key);
      }
    }
  }

  // Method to preload templates for better performance
  async preloadTemplates(projectPaths: string[]): Promise<void> {
    const promises = projectPaths.map(projectPath => 
      this.discoverTemplates(projectPath).catch(() => {
        // Ignore errors during preloading
      })
    );
    
    await Promise.all(promises);
  }
}