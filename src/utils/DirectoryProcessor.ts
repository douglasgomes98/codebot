import * as path from 'node:path';
import { FileSystemManager } from '../managers/FileSystemManager';
import {
  type CodebotError,
  ErrorType,
  type FileSystemEntry,
  type TemplateDirectoryInfo,
  type TemplateFileInfo,
  type TemplateStructure,
} from '../types';

export class DirectoryProcessor {
  private static readonly MAX_DEPTH = 15; // Security limit for directory depth
  private fileSystemManager: FileSystemManager;

  constructor(fileSystemManager?: FileSystemManager) {
    this.fileSystemManager = fileSystemManager || new FileSystemManager();
  }

  async scanTemplateStructure(
    templatePath: string,
  ): Promise<TemplateStructure> {
    try {
      if (!(await this.fileSystemManager.folderExists(templatePath))) {
        throw this.createError(
          `Template directory does not exist: ${templatePath}`,
        );
      }

      const entries =
        await this.fileSystemManager.listFilesRecursive(templatePath);
      return this.buildTemplateStructure(templatePath, entries);
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error; // Re-throw CodebotError instances
      }
      throw this.createError(
        `Failed to scan template structure: ${templatePath}`,
        error,
      );
    }
  }

  private buildTemplateStructure(
    rootPath: string,
    entries: FileSystemEntry[],
  ): TemplateStructure {
    const files: TemplateFileInfo[] = [];
    const directories: TemplateDirectoryInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) {
        const directoryInfo = this.buildDirectoryInfo(rootPath, entry);
        directories.push(directoryInfo);
      } else {
        const fileInfo = this.buildFileInfo(rootPath, entry);
        files.push(fileInfo);
      }
    }

    return {
      rootPath,
      files,
      directories,
    };
  }

  private buildFileInfo(
    _rootPath: string,
    entry: FileSystemEntry,
  ): TemplateFileInfo {
    return {
      name: entry.name,
      path: entry.path,
      relativePath: entry.relativePath,
      extension: path.extname(entry.name),
    };
  }

  private buildDirectoryInfo(
    rootPath: string,
    entry: FileSystemEntry,
  ): TemplateDirectoryInfo {
    const files: TemplateFileInfo[] = [];
    const subdirectories: TemplateDirectoryInfo[] = [];

    if (entry.children) {
      for (const child of entry.children) {
        if (child.isDirectory) {
          const subDirInfo = this.buildDirectoryInfo(rootPath, child);
          subdirectories.push(subDirInfo);
        } else {
          const fileInfo = this.buildFileInfo(rootPath, child);
          files.push(fileInfo);
        }
      }
    }

    return {
      name: entry.name,
      path: entry.path,
      relativePath: entry.relativePath,
      files,
      subdirectories,
    };
  }

  validateDepth(structure: TemplateStructure): void {
    this.validateDirectoryDepth(structure.directories, 0);
  }

  private validateDirectoryDepth(
    directories: TemplateDirectoryInfo[],
    currentDepth: number,
  ): void {
    if (currentDepth > DirectoryProcessor.MAX_DEPTH) {
      throw this.createError(
        `Maximum directory depth exceeded: ${DirectoryProcessor.MAX_DEPTH}`,
      );
    }

    for (const directory of directories) {
      this.validateDirectoryDepth(directory.subdirectories, currentDepth + 1);
    }
  }

  private createError(message: string, originalError?: unknown): CodebotError {
    return {
      type: ErrorType.TEMPLATE_PROCESSING_ERROR,
      message,
      details: originalError,
      recoverable: false,
    };
  }
}
