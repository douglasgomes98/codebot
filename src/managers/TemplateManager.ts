import * as path from 'path';
import * as handlebars from 'handlebars';
import { ITemplateManager, TemplateType, TemplateStructure, ProcessedTemplate, ProcessedFile, ProcessedDirectory } from '../types';
import { CodebotError } from '../errors';
import { TEMPLATE_FILE_EXTENSION, DEFAULT_TEMPLATE_FOLDER } from '../constants';
import { ValidationUtils } from '../utils/validation';
import { DirectoryProcessor } from '../utils/DirectoryProcessor';
import { FileSystemManager } from './FileSystemManager';

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
  private directoryProcessor: DirectoryProcessor;
  private fileSystemManager: FileSystemManager;

  constructor(fileSystemManager?: FileSystemManager) {
    this.fileSystemManager = fileSystemManager || new FileSystemManager();
    this.directoryProcessor = new DirectoryProcessor(this.fileSystemManager);
  }

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

  async processTemplate(templatePath: string, componentName: string): Promise<string> {
    try {
      // Check compiled cache first (cache by template path only, since compiled template is the same regardless of component name)
      const cached = this.compiledCache.get(templatePath);

      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.compiled({ name: this.formatComponentName(componentName) });
      }

      // Read and compile template
      const templateContent = await this.readTemplateFile(templatePath);
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

  async scanTemplateStructure(templatePath: string): Promise<TemplateStructure> {
    try {
      const structure = await this.directoryProcessor.scanTemplateStructure(templatePath);

      // Validate depth for security
      this.directoryProcessor.validateDepth(structure);

      return structure;
    } catch (error) {
      throw CodebotError.templateProcessingError(templatePath, error as Error);
    }
  }

  async processTemplateHierarchy(templateStructure: TemplateStructure, componentName: string): Promise<ProcessedTemplate> {
    try {
      // Extract template folder name from the root path
      const templateFolderName = this.extractTemplateFolderName(templateStructure.rootPath);
      
      const processedFiles = await this.processFiles(templateStructure.files, componentName, '', templateFolderName);
      const processedDirectories = await this.processDirectories(templateStructure.directories, componentName, '', templateFolderName);

      const processedTemplate = {
        componentName,
        files: processedFiles,
        directories: processedDirectories
      };

      // Validate the processed template for integrity
      this.validateProcessedTemplate(processedTemplate);

      return processedTemplate;
    } catch (error) {
      throw CodebotError.templateProcessingError(templateStructure.rootPath, error as Error);
    }
  }

  invalidateCache(): void {
    this.templateCache.clear();
    this.compiledCache.clear();
  }

  getCacheStats(): { templateCacheSize: number; compiledCacheSize: number } {
    return {
      templateCacheSize: this.templateCache.size,
      compiledCacheSize: this.compiledCache.size
    };
  }

  invalidateProjectCache(projectPath: string): void {
    const cacheKey = this.normalizePath(projectPath);
    this.templateCache.delete(cacheKey);
  }

  cleanExpiredCache(): void {
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

  async preloadTemplates(templatePaths: string[]): Promise<void> {
    for (const templatePath of templatePaths) {
      try {
        await this.discoverTemplates(templatePath);
      } catch (error) {
        throw CodebotError.templateProcessingError(templatePath, error as Error);
      }
    }
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
      // Check if template directory exists
      if (!await this.fileSystemManager.folderExists(templatePath)) {
        return []; // Directory doesn't exist
      }

      const entries = await this.fileSystemManager.listDirectories(templatePath);
      const templates: TemplateType[] = [];

      for (const entry of entries) {
        const templateTypePath = path.join(templatePath, entry);
        const files = await this.getTemplateFilesInDirectory(templateTypePath);
        const structure = await this.scanTemplateStructure(templateTypePath);
        const hasSubdirectories = structure.directories.length > 0;

        if (files.length > 0 || hasSubdirectories) {
          templates.push({
            name: entry,
            path: templateTypePath,
            files,
            hasSubdirectories,
            structure
          });
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
      const files = await this.fileSystemManager.listFiles(directoryPath);
      return files.filter((file: string) => ValidationUtils.isTemplateFile(file));
    } catch (error) {
      return [];
    }
  }

  private async readTemplateFile(templatePath: string): Promise<string> {
    try {
      return await this.fileSystemManager.readFile(templatePath);
    } catch (error) {
      throw new Error(`Failed to read template file: ${templatePath}`);
    }
  }

  private formatComponentName(componentName: string): string {
    // Convert to PascalCase, preserving existing case if already in PascalCase
    if (/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
      return componentName; // Already in PascalCase
    }

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

  private extractTemplateFolderName(templateRootPath: string): string | undefined {
    try {
      if (!templateRootPath || typeof templateRootPath !== 'string') {
        return undefined;
      }
      
      // Handle both Unix and Windows path separators
      const normalizedPath = templateRootPath.replace(/\\/g, '/');
      const pathParts = normalizedPath.split('/').filter(part => part.length > 0);
      
      if (pathParts.length === 0) {
        return undefined;
      }
      
      const folderName = pathParts[pathParts.length - 1];
      
      // Return undefined if we can't determine a valid folder name
      if (!folderName || folderName === '.' || folderName === '..') {
        return undefined;
      }
      
      return folderName;
    } catch (error) {
      // If there's any error extracting the folder name, return undefined
      return undefined;
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private async processFiles(files: any[], componentName: string, basePath: string = '', templateFolderName?: string): Promise<ProcessedFile[]> {
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      if (ValidationUtils.isTemplateFile(file.name)) {
        const content = await this.fileSystemManager.readFile(file.path);
        const processedContent = this.processTemplateContent(content, componentName);
        const targetPath = this.generateTargetPath(file.relativePath, componentName, basePath, templateFolderName);

        processedFiles.push({
          originalPath: file.path,
          targetPath,
          content: processedContent
        });
      }
    }

    return processedFiles;
  }

  private async processDirectories(directories: any[], componentName: string, basePath: string = '', templateFolderName?: string): Promise<ProcessedDirectory[]> {
    const processedDirectories: ProcessedDirectory[] = [];

    for (const directory of directories) {
      // Build the accumulated path for this directory
      const currentDirectoryPath = basePath ? path.join(basePath, directory.relativePath) : directory.relativePath;
      
      // Process files and subdirectories with the accumulated path
      const processedFiles = await this.processFiles(directory.files, componentName, currentDirectoryPath, templateFolderName);
      const processedSubdirectories = await this.processDirectories(directory.subdirectories, componentName, currentDirectoryPath, templateFolderName);
      const targetPath = this.generateTargetPath(directory.relativePath, componentName, basePath, templateFolderName);

      processedDirectories.push({
        originalPath: directory.path,
        targetPath,
        files: processedFiles,
        subdirectories: processedSubdirectories
      });
    }

    return processedDirectories;
  }

  private processTemplateContent(content: string, componentName: string): string {
    try {
      const compiled = handlebars.compile(content);
      return compiled({ name: this.formatComponentName(componentName) });
    } catch (error) {
      throw new Error(`Failed to process template content: ${error}`);
    }
  }

  private generateTargetPath(relativePath: string, componentName: string, basePath: string = '', templateFolderName?: string): string {
    // Validate the input relativePath first to prevent path traversal attacks
    this.validateTargetPath(relativePath);
    
    // Validate basePath if provided
    if (basePath) {
      this.validateTargetPath(basePath);
    }

    // Remove .hbs extension and apply naming rules
    let targetPath = relativePath;

    if (targetPath.endsWith(TEMPLATE_FILE_EXTENSION)) {
      targetPath = targetPath.slice(0, -TEMPLATE_FILE_EXTENSION.length);
    }

    // Apply component naming rules to the path
    const processedPath = this.applyNamingRules(targetPath, componentName, templateFolderName);

    // Combine basePath with processedPath using path.join for cross-platform compatibility
    // path.join handles empty strings gracefully and ensures proper path separators
    const finalPath = basePath ? path.join(basePath, processedPath) : processedPath;

    // Validate the final path as well to ensure no issues after processing
    this.validateTargetPath(finalPath);

    return finalPath;
  }

  private applyNamingRules(filePath: string, componentName: string, templateFolderName?: string): string {
    const pathParts = filePath.split(path.sep);
    const fileName = pathParts[pathParts.length - 1];
    let newFileName = fileName;

    // First, check if the filename starts with the template folder name (case-insensitive)
    if (templateFolderName && fileName.toLowerCase().startsWith(templateFolderName.toLowerCase())) {
      // Replace the matched portion with the component name, preserving the case of the component name
      const matchedPortion = fileName.substring(0, templateFolderName.length);
      const remainingPortion = fileName.substring(templateFolderName.length);
      newFileName = this.formatComponentName(componentName) + remainingPortion;
    }

    // Then, apply existing template/Template replacement functionality
    if (newFileName.includes('template') || newFileName.includes('Template')) {
      newFileName = newFileName
        .replace(/template/gi, componentName.toLowerCase())
        .replace(/Template/g, this.formatComponentName(componentName));
    }

    pathParts[pathParts.length - 1] = newFileName;
    return pathParts.join(path.sep);
  }

  private validateTargetPath(targetPath: string): void {
    // Skip validation for empty strings
    if (!targetPath) {
      return;
    }

    // Prevent path traversal attacks - check for .. sequences
    if (targetPath.includes('..')) {
      throw new Error(`Invalid target path - contains path traversal: ${targetPath}`);
    }

    // Prevent absolute paths
    if (path.isAbsolute(targetPath)) {
      throw new Error(`Invalid target path - absolute paths not allowed: ${targetPath}`);
    }

    // Check for Windows and Unix absolute path patterns explicitly
    if (targetPath.startsWith('/') || /^[a-zA-Z]:/.test(targetPath)) {
      throw new Error(`Invalid target path - absolute path detected: ${targetPath}`);
    }

    // Normalize the path and check for any remaining path traversal attempts
    const normalizedPath = path.normalize(targetPath);
    
    // After normalization, check again for path traversal and absolute paths
    if (normalizedPath.includes('..')) {
      throw new Error(`Invalid target path - path traversal detected after normalization: ${normalizedPath}`);
    }
    
    if (path.isAbsolute(normalizedPath)) {
      throw new Error(`Invalid target path - absolute path detected after normalization: ${normalizedPath}`);
    }

    // Additional check for paths that start with path separators after normalization
    if (normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
      throw new Error(`Invalid target path - starts with path separator after normalization: ${normalizedPath}`);
    }

    // Check for Windows drive letters after normalization
    if (/^[a-zA-Z]:/.test(normalizedPath)) {
      throw new Error(`Invalid target path - Windows drive letter detected after normalization: ${normalizedPath}`);
    }
  }

  /**
   * Validates the processed template for integrity issues like duplicate target paths
   * @param processedTemplate The processed template to validate
   * @throws Error if validation fails
   */
  private validateProcessedTemplate(processedTemplate: ProcessedTemplate): void {
    const allTargetPaths = this.collectAllTargetPaths(processedTemplate);
    const duplicates = this.findDuplicatePaths(allTargetPaths);
    
    if (duplicates.length > 0) {
      throw new Error(`Duplicate target paths detected: ${duplicates.join(', ')}`);
    }
  }

  /**
   * Collects all target paths from a processed template, including files in nested directories
   * @param processedTemplate The processed template to collect paths from
   * @returns Array of all target paths
   */
  private collectAllTargetPaths(processedTemplate: ProcessedTemplate): string[] {
    const allPaths: string[] = [];
    
    // Collect paths from root-level files
    for (const file of processedTemplate.files) {
      allPaths.push(file.targetPath);
    }
    
    // Recursively collect paths from directories
    this.collectPathsFromDirectories(processedTemplate.directories, allPaths);
    
    return allPaths;
  }

  /**
   * Recursively collects target paths from directories and their subdirectories
   * @param directories Array of processed directories to collect paths from
   * @param allPaths Array to accumulate all paths
   */
  private collectPathsFromDirectories(directories: ProcessedDirectory[], allPaths: string[]): void {
    for (const directory of directories) {
      // Collect paths from files in this directory
      for (const file of directory.files) {
        allPaths.push(file.targetPath);
      }
      
      // Recursively collect paths from subdirectories
      if (directory.subdirectories.length > 0) {
        this.collectPathsFromDirectories(directory.subdirectories, allPaths);
      }
    }
  }

  /**
   * Finds duplicate paths in an array of target paths
   * @param targetPaths Array of target paths to check for duplicates
   * @returns Array of duplicate paths
   */
  private findDuplicatePaths(targetPaths: string[]): string[] {
    const pathCounts = new Map<string, number>();
    const duplicates: string[] = [];
    
    // Count occurrences of each path
    for (const path of targetPaths) {
      const count = pathCounts.get(path) || 0;
      pathCounts.set(path, count + 1);
    }
    
    // Find paths that appear more than once
    for (const [path, count] of pathCounts.entries()) {
      if (count > 1) {
        duplicates.push(path);
      }
    }
    
    return duplicates;
  }
}