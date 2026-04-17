import * as path from 'node:path';
import { CodebotError } from '../errors';
import { ErrorType, type IPathResolver, type ProjectContext } from '../types';

export class PathResolver implements IPathResolver {
  private static readonly FORBIDDEN_PATTERNS = [
    /\.\./, // Parent directory traversal
    /^\/+/, // Absolute paths starting with /
    /^[a-zA-Z]:\\/, // Windows absolute paths
    /\0/, // Null bytes
    /[<>:"|?*]/, // Invalid filename characters
  ];

  private static readonly MAX_PATH_LENGTH = 260; // Windows MAX_PATH limitation
  private static readonly MAX_COMPONENT_NAME_LENGTH = 200; // Reasonable component name limit
  private static readonly RESERVED_NAMES = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ];

  /**
   * Resolves the template path based on project context
   * Follows hierarchy: project-specific templates → workspace templates → fallback
   */
  resolveTemplatePath(
    projectContext: ProjectContext,
    templateName: string,
  ): string {
    // Check for dangerous security patterns first
    if (!this.validatePathSecurity(templateName)) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Invalid template name: ${templateName}`,
        { templateName },
        false,
      );
    }

    const sanitizedTemplateName = this.sanitizePath(templateName);

    // For multi-project workspaces, prefer project-specific templates
    if (projectContext.isMultiProject) {
      const projectTemplatePath = path.join(
        projectContext.projectRoot,
        'templates',
        sanitizedTemplateName,
      );
      return this.normalizePath(projectTemplatePath);
    }

    // For single project or fallback, use workspace-level templates
    const workspaceTemplatePath = path.join(
      projectContext.workspaceRoot,
      'templates',
      sanitizedTemplateName,
    );
    return this.normalizePath(workspaceTemplatePath);
  }

  /**
   * Resolves the target path where component will be created
   * Ensures path is within project boundaries
   */
  resolveTargetPath(
    projectContext: ProjectContext,
    componentName: string,
    selectedFolderPath?: string,
  ): string {
    // Check for dangerous security patterns first
    if (!this.validatePathSecurity(componentName)) {
      throw new CodebotError(
        ErrorType.INVALID_COMPONENT_NAME,
        `Invalid component name: ${componentName}`,
        { componentName },
        true,
      );
    }

    const sanitizedComponentName = this.sanitizePath(componentName);

    // Determine the base path for component creation
    const basePath = this.resolveBasePath(projectContext, selectedFolderPath);
    const targetPath = path.join(basePath, sanitizedComponentName);

    // Ensure the resolved path is within project boundaries
    if (!this.isWithinProjectBoundaries(targetPath, projectContext)) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Target path is outside project boundaries: ${targetPath}`,
        { targetPath, projectRoot: projectContext.projectRoot },
        false,
      );
    }

    return this.normalizePath(targetPath);
  }

  /**
   * Validates a path for security and correctness (strict validation)
   */
  validatePath(inputPath: string): boolean {
    if (!inputPath || typeof inputPath !== 'string') {
      return false;
    }

    // Check path length
    if (inputPath.length > PathResolver.MAX_PATH_LENGTH) {
      return false;
    }

    // Check for forbidden patterns
    for (const pattern of PathResolver.FORBIDDEN_PATTERNS) {
      if (pattern.test(inputPath)) {
        return false;
      }
    }

    // Check for reserved names (Windows)
    const pathParts = inputPath.split(/[/\\]/);
    for (const part of pathParts) {
      const upperPart = part.toUpperCase();
      if (PathResolver.RESERVED_NAMES.includes(upperPart)) {
        return false;
      }
    }

    // Check for empty path segments
    if (pathParts.some(part => part === '')) {
      return false;
    }

    return true;
  }

  /**
   * Validates a path strictly for dangerous security patterns only
   */
  private validatePathSecurity(inputPath: string): boolean {
    if (!inputPath || typeof inputPath !== 'string') {
      return false;
    }

    // Check component name length (reasonable limit)
    if (inputPath.length > PathResolver.MAX_COMPONENT_NAME_LENGTH) {
      return false;
    }

    // Check for dangerous patterns only
    const dangerousPatterns = [
      /\.\./, // Parent directory traversal
      /^\/+/, // Absolute paths starting with /
      /^[a-zA-Z]:\\/, // Windows absolute paths
      /\0/, // Null bytes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(inputPath)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitizes a path by removing dangerous characters and patterns
   */
  sanitizePath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      return '';
    }

    let sanitized = inputPath
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove or replace invalid characters
      .replace(/[<>:"|?*]/g, '_')
      // Remove leading/trailing whitespace and dots
      .trim()
      .replace(/^\.+|\.+$/g, '')
      // Normalize path separators
      .replace(/[/\\]+/g, path.sep)
      // Remove parent directory references
      .replace(/\.\.[/\\]/g, '')
      .replace(/\.\.$/, '');

    // Ensure it doesn't start with a path separator
    sanitized = sanitized.replace(/^[/\\]+/, '');

    // Handle reserved names by appending underscore
    const pathParts = sanitized.split(path.sep);
    const sanitizedParts = pathParts.map(part => {
      const upperPart = part.toUpperCase();
      if (PathResolver.RESERVED_NAMES.includes(upperPart)) {
        return `${part}_`;
      }
      return part;
    });

    return sanitizedParts.join(path.sep);
  }

  /**
   * Resolves the configuration file path for a project
   */
  resolveConfigPath(projectContext: ProjectContext): string {
    // For multi-project, prefer project-specific config
    if (projectContext.isMultiProject) {
      const projectConfigPath = path.join(
        projectContext.projectRoot,
        'codebot.config.json',
      );
      return this.normalizePath(projectConfigPath);
    }

    // For single project, use workspace-level config
    const workspaceConfigPath = path.join(
      projectContext.workspaceRoot,
      'codebot.config.json',
    );
    return this.normalizePath(workspaceConfigPath);
  }

  /**
   * Resolves relative paths to absolute paths within project context
   */
  resolveRelativePath(
    projectContext: ProjectContext,
    relativePath: string,
  ): string {
    // Check for dangerous security patterns first
    if (!this.validatePathSecurity(relativePath)) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Invalid relative path: ${relativePath}`,
        { relativePath },
        false,
      );
    }

    const sanitizedPath = this.sanitizePath(relativePath);

    const basePath = this.resolveBasePath(projectContext);
    const absolutePath = path.resolve(basePath, sanitizedPath);

    // Ensure the resolved path is within project boundaries
    if (!this.isWithinProjectBoundaries(absolutePath, projectContext)) {
      throw new CodebotError(
        ErrorType.FILE_SYSTEM_ERROR,
        `Resolved path is outside project boundaries: ${absolutePath}`,
        { relativePath, absolutePath, projectRoot: projectContext.projectRoot },
        false,
      );
    }

    return this.normalizePath(absolutePath);
  }

  /**
   * Determines the base path for operations based on project context
   */
  private resolveBasePath(
    projectContext: ProjectContext,
    selectedFolderPath?: string,
  ): string {
    // If a specific folder was selected, use that as the base path
    if (selectedFolderPath) {
      // Ensure the selected folder is within project boundaries
      if (this.isWithinProjectBoundaries(selectedFolderPath, projectContext)) {
        return selectedFolderPath;
      }
    }

    // Fallback to project root
    return projectContext.projectRoot;
  }

  /**
   * Checks if a path is within the allowed project boundaries
   */
  private isWithinProjectBoundaries(
    targetPath: string,
    projectContext: ProjectContext,
  ): boolean {
    const normalizedTarget = this.normalizePath(targetPath);
    const normalizedProjectRoot = this.normalizePath(
      projectContext.projectRoot,
    );
    const normalizedWorkspaceRoot = this.normalizePath(
      projectContext.workspaceRoot,
    );

    // Path must be within either project root or workspace root
    return (
      normalizedTarget.startsWith(normalizedProjectRoot) ||
      normalizedTarget.startsWith(normalizedWorkspaceRoot)
    );
  }

  /**
   * Normalizes path separators and resolves relative components
   */
  private normalizePath(inputPath: string): string {
    return path.resolve(inputPath).replace(/\\/g, '/');
  }
}
