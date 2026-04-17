import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { FileSystemManager } from '../../managers/FileSystemManager';
import { ErrorType } from '../../types';

describe('FileSystemManager', () => {
  let fileSystemManager: FileSystemManager;
  let tempDir: string;

  beforeEach(() => {
    fileSystemManager = new FileSystemManager();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebot-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('createFile', () => {
    it('should create a file with content', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      const content = 'Hello, World!';

      await fileSystemManager.createFile(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe(content);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(tempDir, 'nested', 'deep', 'test.txt');
      const content = 'Nested file content';

      await fileSystemManager.createFile(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe(content);
    });
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      const folderPath = path.join(tempDir, 'testFolder');

      await fileSystemManager.createFolder(folderPath);

      expect(fs.existsSync(folderPath)).toBe(true);
      expect(fs.statSync(folderPath).isDirectory()).toBe(true);
    });

    it('should not throw error if folder already exists', async () => {
      const folderPath = path.join(tempDir, 'existingFolder');
      fs.mkdirSync(folderPath);

      await expect(
        fileSystemManager.createFolder(folderPath),
      ).resolves.not.toThrow();
    });
  });

  describe('createFolderRecursive', () => {
    it('should create nested folder structure', async () => {
      const folderPath = path.join(tempDir, 'level1', 'level2', 'level3');

      await fileSystemManager.createFolderRecursive(folderPath);

      expect(fs.existsSync(folderPath)).toBe(true);
      expect(fs.statSync(folderPath).isDirectory()).toBe(true);
    });

    it('should not throw error if folder structure already exists', async () => {
      const folderPath = path.join(tempDir, 'existing', 'nested');
      fs.mkdirSync(folderPath, { recursive: true });

      await expect(
        fileSystemManager.createFolderRecursive(folderPath),
      ).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'existing.txt');
      fs.writeFileSync(filePath, 'content');

      const exists = await fileSystemManager.fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');

      const exists = await fileSystemManager.fileExists(filePath);

      expect(exists).toBe(false);
    });

    it('should return false for directory path', async () => {
      const dirPath = path.join(tempDir, 'directory');
      fs.mkdirSync(dirPath);

      const exists = await fileSystemManager.fileExists(dirPath);

      expect(exists).toBe(false);
    });
  });

  describe('folderExists', () => {
    it('should return true for existing folder', async () => {
      const folderPath = path.join(tempDir, 'existingFolder');
      fs.mkdirSync(folderPath);

      const exists = await fileSystemManager.folderExists(folderPath);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing folder', async () => {
      const folderPath = path.join(tempDir, 'nonexistentFolder');

      const exists = await fileSystemManager.folderExists(folderPath);

      expect(exists).toBe(false);
    });

    it('should return false for file path', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      fs.writeFileSync(filePath, 'content');

      const exists = await fileSystemManager.folderExists(filePath);

      expect(exists).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = path.join(tempDir, 'content.txt');
      const content = 'File content to read';
      fs.writeFileSync(filePath, content);

      const readContent = await fileSystemManager.readFile(filePath);

      expect(readContent).toBe(content);
    });

    it('should throw error for non-existing file', async () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');

      await expect(fileSystemManager.readFile(filePath)).rejects.toMatchObject({
        type: ErrorType.FILE_SYSTEM_ERROR,
      });
    });
  });

  describe('listFiles', () => {
    it('should list only files in directory', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.js');
      const subDir = path.join(tempDir, 'subdir');

      fs.writeFileSync(file1, 'content1');
      fs.writeFileSync(file2, 'content2');
      fs.mkdirSync(subDir);

      const files = await fileSystemManager.listFiles(tempDir);

      expect(files).toHaveLength(2);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.js');
      expect(files).not.toContain('subdir');
    });

    it('should return empty array for non-existing directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      const files = await fileSystemManager.listFiles(nonExistentDir);

      expect(files).toEqual([]);
    });
  });

  describe('listDirectories', () => {
    it('should list only directories in directory', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.js');
      const subDir1 = path.join(tempDir, 'subdir1');
      const subDir2 = path.join(tempDir, 'subdir2');

      fs.writeFileSync(file1, 'content1');
      fs.writeFileSync(file2, 'content2');
      fs.mkdirSync(subDir1);
      fs.mkdirSync(subDir2);

      const directories = await fileSystemManager.listDirectories(tempDir);

      expect(directories).toHaveLength(2);
      expect(directories).toContain('subdir1');
      expect(directories).toContain('subdir2');
      expect(directories).not.toContain('file1.txt');
      expect(directories).not.toContain('file2.js');
    });

    it('should return empty array for non-existing directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      const directories =
        await fileSystemManager.listDirectories(nonExistentDir);

      expect(directories).toEqual([]);
    });
  });

  describe('listFilesRecursive', () => {
    beforeEach(() => {
      // Create test directory structure
      const structure = {
        'file1.txt': 'content1',
        'file2.js': 'content2',
        'subdir1/file3.ts': 'content3',
        'subdir1/file4.css': 'content4',
        'subdir1/nested/file5.html': 'content5',
        'subdir2/file6.json': 'content6',
      };

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(tempDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
      }
    });

    it('should list all files and directories recursively', async () => {
      const entries = await fileSystemManager.listFilesRecursive(tempDir);

      // Should have root files and directories
      expect(entries.length).toBeGreaterThan(0);

      // Check for root files
      const rootFiles = entries.filter(e => !e.isDirectory);
      expect(rootFiles.some(f => f.name === 'file1.txt')).toBe(true);
      expect(rootFiles.some(f => f.name === 'file2.js')).toBe(true);

      // Check for directories
      const directories = entries.filter(e => e.isDirectory);
      expect(directories.some(d => d.name === 'subdir1')).toBe(true);
      expect(directories.some(d => d.name === 'subdir2')).toBe(true);

      // Check nested structure
      const subdir1 = directories.find(d => d.name === 'subdir1');
      expect(subdir1?.children).toBeDefined();
      expect(subdir1?.children?.some(c => c.name === 'file3.ts')).toBe(true);
      expect(
        subdir1?.children?.some(c => c.name === 'nested' && c.isDirectory),
      ).toBe(true);
    });

    it('should set correct relative paths', async () => {
      const entries = await fileSystemManager.listFilesRecursive(tempDir);

      const subdir1 = entries.find(e => e.name === 'subdir1' && e.isDirectory);
      expect(subdir1?.relativePath).toBe('subdir1');

      const nestedFile = subdir1?.children?.find(c => c.name === 'file3.ts');
      expect(nestedFile?.relativePath).toBe('file3.ts');
    });

    it('should return empty array for non-existing directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      const entries =
        await fileSystemManager.listFilesRecursive(nonExistentDir);

      expect(entries).toEqual([]);
    });

    it('should throw error when maximum depth is exceeded', async () => {
      // Create a very deep directory structure (more than 15 levels)
      let deepPath = tempDir;
      for (let i = 0; i < 17; i++) {
        deepPath = path.join(deepPath, `level${i}`);
        fs.mkdirSync(deepPath, { recursive: true });
      }

      await expect(
        fileSystemManager.listFilesRecursive(tempDir),
      ).rejects.toMatchObject({
        type: ErrorType.FILE_SYSTEM_ERROR,
        message: expect.stringContaining('Maximum directory depth exceeded'),
      });
    });
  });

  describe('copyDirectoryStructure', () => {
    let sourceDir: string;
    let targetDir: string;

    beforeEach(() => {
      sourceDir = path.join(tempDir, 'source');
      targetDir = path.join(tempDir, 'target');

      // Create source directory structure
      const structure = {
        'file1.txt': 'content1',
        'file2.js': 'content2',
        'subdir1/file3.ts': 'content3',
        'subdir1/nested/file4.html': 'content4',
        'subdir2/file5.json': 'content5',
      };

      fs.mkdirSync(sourceDir);
      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(sourceDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
      }
    });

    it('should copy entire directory structure', async () => {
      await fileSystemManager.copyDirectoryStructure(sourceDir, targetDir);

      // Verify target directory exists
      expect(fs.existsSync(targetDir)).toBe(true);

      // Verify files are copied
      expect(fs.existsSync(path.join(targetDir, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'file2.js'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'subdir1', 'file3.ts'))).toBe(
        true,
      );
      expect(
        fs.existsSync(path.join(targetDir, 'subdir1', 'nested', 'file4.html')),
      ).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'subdir2', 'file5.json'))).toBe(
        true,
      );

      // Verify content is copied correctly
      expect(fs.readFileSync(path.join(targetDir, 'file1.txt'), 'utf8')).toBe(
        'content1',
      );
      expect(
        fs.readFileSync(
          path.join(targetDir, 'subdir1', 'nested', 'file4.html'),
          'utf8',
        ),
      ).toBe('content4');
    });

    it('should create target directory if it does not exist', async () => {
      const deepTargetDir = path.join(tempDir, 'deep', 'nested', 'target');

      await fileSystemManager.copyDirectoryStructure(sourceDir, deepTargetDir);

      expect(fs.existsSync(deepTargetDir)).toBe(true);
      expect(fs.existsSync(path.join(deepTargetDir, 'file1.txt'))).toBe(true);
    });

    it('should throw error if source directory does not exist', async () => {
      const nonExistentSource = path.join(tempDir, 'nonexistent');

      await expect(
        fileSystemManager.copyDirectoryStructure(nonExistentSource, targetDir),
      ).rejects.toMatchObject({
        type: ErrorType.FILE_SYSTEM_ERROR,
        message: expect.stringContaining('Source directory does not exist'),
      });
    });
  });
});
