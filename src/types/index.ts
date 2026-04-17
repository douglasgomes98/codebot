export interface ConfigurationFile {
  templateFolderPath?: string;
  multiProject?: {
    enabled: boolean;
    projectDetection: 'auto' | 'manual';
  };
}

export interface ProjectContext {
  workspaceRoot: string;
  projectRoot: string;
  templatePath: string;
  configPath: string;
  isMultiProject: boolean;
  projectName?: string;
}

export interface TemplateType {
  name: string;
  path: string;
  files: string[];
  hasSubdirectories: boolean;
  structure: TemplateStructure;
}

export interface Template {
  name: string;
  type: string;
  files: TemplateFile[];
  metadata: TemplateMetadata;
}

export interface TemplateFile {
  originalName: string;
  targetName: string;
  content: string;
  variables: string[];
}

export interface TemplateMetadata {
  description?: string;
  author?: string;
  version?: string;
  dependencies?: string[];
}

export interface GenerationContext {
  componentName: string;
  targetPath: string;
  templateType: string;
  variables: Record<string, any>;
  options: GenerationOptions;
}

export interface GenerationOptions {
  overwriteExisting: boolean;
  createMissingDirectories: boolean;
  formatCode: boolean;
}

export interface FileSystemEntry {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  children?: FileSystemEntry[];
}

export interface TemplateStructure {
  rootPath: string;
  files: TemplateFileInfo[];
  directories: TemplateDirectoryInfo[];
}

export interface TemplateFileInfo {
  name: string;
  path: string;
  relativePath: string;
  extension: string;
}

export interface TemplateDirectoryInfo {
  name: string;
  path: string;
  relativePath: string;
  files: TemplateFileInfo[];
  subdirectories: TemplateDirectoryInfo[];
}

export interface ProcessedTemplate {
  componentName: string;
  files: ProcessedFile[];
  directories: ProcessedDirectory[];
}

export interface ProcessedFile {
  originalPath: string;
  targetPath: string;
  content: string;
}

export interface ProcessedDirectory {
  originalPath: string;
  targetPath: string;
  files: ProcessedFile[];
  subdirectories: ProcessedDirectory[];
}

export enum ErrorType {
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  INVALID_COMPONENT_NAME = 'INVALID_COMPONENT_NAME',
  TEMPLATE_FOLDER_EMPTY = 'TEMPLATE_FOLDER_EMPTY',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  TEMPLATE_PROCESSING_ERROR = 'TEMPLATE_PROCESSING_ERROR',
  PROJECT_DETECTION_ERROR = 'PROJECT_DETECTION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface CodebotError {
  type: ErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface CommandArgs {
  fsPath?: string;
}

// Re-export interfaces and utilities for convenience
export * from '../interfaces';
export * from '../errors';
export * from '../constants';
export * from '../utils';
