import { ProjectContext, TemplateType, ConfigurationFile, CodebotError, FileSystemEntry, TemplateStructure, ProcessedTemplate } from '../types';

export interface IProjectDetector {
  detectProject(folderPath: string): Promise<ProjectContext>;
  isMultiProjectWorkspace(): boolean;
  resolveProjectRoot(folderPath: string): string;
}

export interface IConfigurationManager {
  getConfiguration(projectPath: string): Promise<ConfigurationFile>;
  resolveTemplatePath(projectPath: string): string;
  getConfigurationPath(projectPath: string): string;
}

export interface ITemplateManager {
  discoverTemplates(projectPath: string): Promise<TemplateType[]>;
  processTemplate(templatePath: string, componentName: string): Promise<string>;
  getTemplateFiles(templateType: string): string[];
  scanTemplateStructure(templatePath: string): Promise<TemplateStructure>;
  processTemplateHierarchy(templateStructure: TemplateStructure, componentName: string): Promise<ProcessedTemplate>;
  invalidateCache(): void;
}

export interface IFileSystemManager {
  createFile(path: string, content: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  createFolderRecursive(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  folderExists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  listFiles(path: string): Promise<string[]>;
  listDirectories(path: string): Promise<string[]>;
  listFilesRecursive(path: string): Promise<FileSystemEntry[]>;
  copyDirectoryStructure(sourcePath: string, targetPath: string): Promise<void>;
}

export interface IPathResolver {
  resolveTemplatePath(projectContext: ProjectContext, templateName: string): string;
  resolveTargetPath(projectContext: ProjectContext, componentName: string, selectedFolderPath?: string): string;
  validatePath(path: string): boolean;
  sanitizePath(path: string): string;
}

export interface IErrorHandler {
  handleError(error: CodebotError): void;
  createError(type: string, message: string, details?: any): CodebotError;
  isRecoverable(error: CodebotError): boolean;
}

export interface IUIManager {
  getComponentName(): Promise<string>;
  selectTemplate(templates: TemplateType[]): Promise<TemplateType | undefined>;
  showMessage(message: string, type: 'info' | 'error' | 'warning'): void;
}