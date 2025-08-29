import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DirectoryProcessor } from '../../utils/DirectoryProcessor';
import { FileSystemManager } from '../../managers/FileSystemManager';
import { TemplateStructure, ErrorType } from '../../types';

describe('DirectoryProcessor', () => {
  let directoryProcessor: DirectoryProcessor;
  let fileSystemManager: FileSystemManager;
  let tempDir: string;

  beforeEach(() => {
    fileSystemManager = new FileSystemManager();
    directoryProcessor = new DirectoryProcessor(fileSystemManager);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebot-dirproc-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('scanTemplateStructure', () => {
    beforeEach(async () => {
      // Create complex directory structure
      const structure = {
        'root-file1.hbs': 'root content 1',
        'root-file2.js': 'root content 2',
        'level1/file1.hbs': 'level1 content 1',
        'level1/file2.css': 'level1 content 2',
        'level1/level2/file3.hbs': 'level2 content 1',
        'level1/level2/level3/file4.html': 'level3 content 1',
        'another-level1/file5.hbs': 'another level1 content'
      };

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(tempDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }
    });

    it('should scan complete directory structure', async () => {
      const structure = await directoryProcessor.scanTemplateStructure(tempDir);

      expect(structure.rootPath).toBe(tempDir);
      expect(structure.files).toHaveLength(2); // root-file1.hbs, root-file2.js
      expect(structure.directories).toHaveLength(2); // level1, another-level1

      // Check level1 directory
      const level1Dir = structure.directories.find(d => d.name === 'level1');
      expect(level1Dir).toBeDefined();
      expect(level1Dir?.files).toHaveLength(2); // file1.hbs, file2.css
      expect(level1Dir?.subdirectories).toHaveLength(1); // level2

      // Check level2 directory
      const level2Dir = level1Dir?.subdirectories.find(d => d.name === 'level2');
      expect(level2Dir).toBeDefined();
      expect(level2Dir?.files).toHaveLength(1); // file3.hbs
      expect(level2Dir?.subdirectories).toHaveLength(1); // level3

      // Check level3 directory
      const level3Dir = level2Dir?.subdirectories.find(d => d.name === 'level3');
      expect(level3Dir).toBeDefined();
      expect(level3Dir?.files).toHaveLength(1); // file4.html
      expect(level3Dir?.subdirectories).toHaveLength(0);
    });

    it('should set correct relative paths', async () => {
      const structure = await directoryProcessor.scanTemplateStructure(tempDir);

      // Check root files
      const rootFile = structure.files.find(f => f.name === 'root-file1.hbs');
      expect(rootFile?.relativePath).toBe('root-file1.hbs');

      // Check nested directory
      const level1Dir = structure.directories.find(d => d.name === 'level1');
      expect(level1Dir?.relativePath).toBe('level1');

      // Check nested file
      const nestedFile = level1Dir?.files.find(f => f.name === 'file1.hbs');
      expect(nestedFile?.relativePath).toBe('file1.hbs');
    });

    it('should handle empty directories', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fileSystemManager.createFolderRecursive(emptyDir);

      const structure = await directoryProcessor.scanTemplateStructure(tempDir);

      const emptyDirEntry = structure.directories.find(d => d.name === 'empty');
      expect(emptyDirEntry).toBeDefined();
      expect(emptyDirEntry?.files).toHaveLength(0);
      expect(emptyDirEntry?.subdirectories).toHaveLength(0);
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      await expect(directoryProcessor.scanTemplateStructure(nonExistentDir))
        .rejects.toMatchObject({
          type: ErrorType.TEMPLATE_PROCESSING_ERROR,
          message: expect.stringContaining('Template directory does not exist')
        });
    });
  });

  describe('validateDepth', () => {
    it('should pass validation for normal depth', async () => {
      // Create structure with depth 3
      const structure = {
        'level1/level2/level3/file.hbs': 'content'
      };

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(tempDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }

      const templateStructure = await directoryProcessor.scanTemplateStructure(tempDir);

      expect(() => directoryProcessor.validateDepth(templateStructure)).not.toThrow();
    });

    it('should throw error when maximum depth is exceeded', async () => {
      // Create structure with depth > 15
      let deepPath = tempDir;
      for (let i = 0; i < 17; i++) {
        deepPath = path.join(deepPath, `level${i}`);
      }
      await fileSystemManager.createFile(path.join(deepPath, 'file.hbs'), 'content');

      // The error should be thrown during scanning, not validation
      await expect(directoryProcessor.scanTemplateStructure(tempDir))
        .rejects.toMatchObject({
          type: ErrorType.FILE_SYSTEM_ERROR,
          message: expect.stringContaining('Maximum directory depth exceeded')
        });
    });
  });

  describe('file extension handling', () => {
    beforeEach(async () => {
      const structure = {
        'template.hbs': 'handlebars template',
        'style.css': 'css content',
        'script.js': 'js content',
        'config.json': 'json content',
        'readme.md': 'markdown content'
      };

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(tempDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }
    });

    it('should correctly identify file extensions', async () => {
      const structure = await directoryProcessor.scanTemplateStructure(tempDir);

      const hbsFile = structure.files.find(f => f.name === 'template.hbs');
      expect(hbsFile?.extension).toBe('.hbs');

      const cssFile = structure.files.find(f => f.name === 'style.css');
      expect(cssFile?.extension).toBe('.css');

      const jsFile = structure.files.find(f => f.name === 'script.js');
      expect(jsFile?.extension).toBe('.js');

      const jsonFile = structure.files.find(f => f.name === 'config.json');
      expect(jsonFile?.extension).toBe('.json');

      const mdFile = structure.files.find(f => f.name === 'readme.md');
      expect(mdFile?.extension).toBe('.md');
    });
  });

  describe('complex nested structures', () => {
    beforeEach(async () => {
      // Create a realistic component template structure
      const structure = {
        'index.hbs': 'export { default } from "./{{name}}";',
        '{{name}}.hbs': 'import React from "react";',
        '{{name}}.test.hbs': 'import { render } from "@testing-library/react";',
        'styles/index.css.hbs': '@import "./{{name}}.css";',
        'styles/{{name}}.css.hbs': '.{{name}} { display: block; }',
        'styles/themes/light.css.hbs': '.{{name}}.light { background: white; }',
        'styles/themes/dark.css.hbs': '.{{name}}.dark { background: black; }',
        'utils/helpers.js.hbs': 'export const {{name}}Helper = () => {};',
        'utils/constants.js.hbs': 'export const {{name}}_CONSTANTS = {};',
        'assets/icons/icon.svg.hbs': '<svg>{{name}}</svg>',
        'docs/README.md.hbs': '# {{name}} Component'
      };

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(tempDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }
    });

    it('should handle complex nested component structure', async () => {
      const structure = await directoryProcessor.scanTemplateStructure(tempDir);

      expect(structure.files).toHaveLength(3); // index.hbs, {{name}}.hbs, {{name}}.test.hbs
      expect(structure.directories).toHaveLength(4); // styles, utils, assets, docs

      // Check styles directory
      const stylesDir = structure.directories.find(d => d.name === 'styles');
      expect(stylesDir?.files).toHaveLength(2); // index.css.hbs, {{name}}.css.hbs
      expect(stylesDir?.subdirectories).toHaveLength(1); // themes

      // Check themes subdirectory
      const themesDir = stylesDir?.subdirectories.find(d => d.name === 'themes');
      expect(themesDir?.files).toHaveLength(2); // light.css.hbs, dark.css.hbs

      // Check utils directory
      const utilsDir = structure.directories.find(d => d.name === 'utils');
      expect(utilsDir?.files).toHaveLength(2); // helpers.js.hbs, constants.js.hbs

      // Check assets directory with nested icons
      const assetsDir = structure.directories.find(d => d.name === 'assets');
      expect(assetsDir?.subdirectories).toHaveLength(1); // icons
      
      const iconsDir = assetsDir?.subdirectories.find(d => d.name === 'icons');
      expect(iconsDir?.files).toHaveLength(1); // icon.svg.hbs
    });
  });
});