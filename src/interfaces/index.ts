import { ProjectContext, TemplateType, ConfigurationFile, CodebotError } from '../types';

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
  processTemplate(templatePath: string, componentName: string): string;
  getTemplateFiles(templateType: string): string[];
  invalidateCache(): void;
}

export interface IFileSystemManager {
  createFile(path: string, content: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  folderExists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  listFiles(path: string): Promise<string[]>;
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