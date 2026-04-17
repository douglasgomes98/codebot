import * as fs from 'fs';
import * as path from 'path';
import { IFileSystemManager } from '../interfaces';
import { FileSystemEntry, ErrorType, CodebotError } from '../types';

export class FileSystemManager implements IFileSystemManager {
  private static readonly MAX_DEPTH = 15; // Security limit for directory depth

  async createFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists before creating file
      const dir = path.dirname(filePath);
      await this.createFolderRecursive(dir);
      
      fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
    } catch (error) {
      throw this.createFileSystemError(`Failed to create file: ${filePath}`, error);
    }
  }

  async createFolder(folderPath: string): Promise<void> {
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
    } catch (error) {
      throw this.createFileSystemError(`Failed to create folder: ${folderPath}`, error);
    }
  }

  async createFolderRecursive(folderPath: string): Promise<void> {
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    } catch (error) {
      throw this.createFileSystemError(`Failed to create folder recursively: ${folderPath}`, error);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  async folderExists(folderPath: string): Promise<boolean> {
    try {
      const stats = fs.statSync(folderPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw this.createFileSystemError(`Failed to read file: ${filePath}`, error);
    }
  }

  async listFiles(folderPath: string): Promise<string[]> {
    try {
      if (!await this.folderExists(folderPath)) {
        return [];
      }
      
      const entries = fs.readdirSync(folderPath);
      const files: string[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry);
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          files.push(entry);
        }
      }
      
      return files;
    } catch (error) {
      throw this.createFileSystemError(`Failed to list files in: ${folderPath}`, error);
    }
  }

  async listDirectories(folderPath: string): Promise<string[]> {
    try {
      if (!await this.folderExists(folderPath)) {
        return [];
      }
      
      const entries = fs.readdirSync(folderPath);
      const directories: string[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          directories.push(entry);
        }
      }
      
      return directories;
    } catch (error) {
      throw this.createFileSystemError(`Failed to list directories in: ${folderPath}`, error);
    }
  }

  async listFilesRecursive(folderPath: string, currentDepth: number = 0): Promise<FileSystemEntry[]> {
    if (currentDepth > FileSystemManager.MAX_DEPTH) {
      throw this.createFileSystemError(`Maximum directory depth exceeded: ${FileSystemManager.MAX_DEPTH}`, null);
    }

    try {
      if (!await this.folderExists(folderPath)) {
        return [];
      }

      const entries: FileSystemEntry[] = [];
      const items = fs.readdirSync(folderPath);

      for (const item of items) {
        const fullPath = path.join(folderPath, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(folderPath, fullPath);

        if (stats.isDirectory()) {
          const children = await this.listFilesRecursive(fullPath, currentDepth + 1);
          entries.push({
            name: item,
            path: fullPath,
            relativePath,
            isDirectory: true,
            children
          });
        } else {
          entries.push({
            name: item,
            path: fullPath,
            relativePath,
            isDirectory: false
          });
        }
      }

      return entries;
    } catch (error) {
      // Re-throw CodebotError instances (including depth errors) without wrapping
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.FILE_SYSTEM_ERROR) {
        throw error;
      }
      throw this.createFileSystemError(`Failed to list files recursively in: ${folderPath}`, error);
    }
  }

  async copyDirectoryStructure(sourcePath: string, targetPath: string): Promise<void> {
    try {
      if (!await this.folderExists(sourcePath)) {
        throw this.createFileSystemError(`Source directory does not exist: ${sourcePath}`, null);
      }

      await this.createFolderRecursive(targetPath);
      
      const entries = await this.listFilesRecursive(sourcePath);
      await this.copyEntriesRecursive(entries, sourcePath, targetPath);
    } catch (error) {
      // Re-throw CodebotError instances without wrapping
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.FILE_SYSTEM_ERROR) {
        throw error;
      }
      throw this.createFileSystemError(`Failed to copy directory structure from ${sourcePath} to ${targetPath}`, error);
    }
  }

  private async copyEntriesRecursive(entries: FileSystemEntry[], sourcePath: string, targetPath: string): Promise<void> {
    for (const entry of entries) {
      const sourceEntryPath = entry.path;
      const relativeToSource = path.relative(sourcePath, sourceEntryPath);
      const targetEntryPath = path.join(targetPath, relativeToSource);

      if (entry.isDirectory) {
        await this.createFolderRecursive(targetEntryPath);
        if (entry.children) {
          await this.copyEntriesRecursive(entry.children, sourcePath, targetPath);
        }
      } else {
        const content = await this.readFile(sourceEntryPath);
        await this.createFile(targetEntryPath, content);
      }
    }
  }

  private createFileSystemError(message: string, originalError: any): CodebotError {
    return {
      type: ErrorType.FILE_SYSTEM_ERROR,
      message,
      details: originalError,
      recoverable: false
    };
  }
}