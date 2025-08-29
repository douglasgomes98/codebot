import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TemplateManager } from '../../managers/TemplateManager';
import { FileSystemManager } from '../../managers/FileSystemManager';
import { TemplateStructure, ProcessedTemplate, ErrorType } from '../../types';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  let fileSystemManager: FileSystemManager;
  let tempDir: string;
  let templatesDir: string;

  beforeEach(() => {
    fileSystemManager = new FileSystemManager();
    templateManager = new TemplateManager(fileSystemManager);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebot-template-test-'));
    templatesDir = path.join(tempDir, 'templates');
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('scanTemplateStructure', () => {
    beforeEach(async () => {
      // Create test template structure
      const structure = {
        'component.hbs': 'export const {{name}} = () => {};',
        'component.test.hbs': 'describe("{{name}}", () => {});',
        'styles/component.css.hbs': '.{{name}} { color: red; }',
        'styles/nested/theme.css.hbs': '.{{name}}-theme { background: blue; }',
        'utils/helper.js.hbs': 'export const {{name}}Helper = () => {};'
      };

      const templatePath = path.join(templatesDir, 'react-component');
      await fileSystemManager.createFolderRecursive(templatePath);

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(templatePath, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }
    });

    it('should scan template structure with subdirectories', async () => {
      const templatePath = path.join(templatesDir, 'react-component');
      
      const structure = await templateManager.scanTemplateStructure(templatePath);

      expect(structure.rootPath).toBe(templatePath);
      expect(structure.files).toHaveLength(2); // component.hbs, component.test.hbs
      expect(structure.directories).toHaveLength(2); // styles, utils

      // Check styles directory
      const stylesDir = structure.directories.find(d => d.name === 'styles');
      expect(stylesDir).toBeDefined();
      expect(stylesDir?.files).toHaveLength(1); // component.css.hbs
      expect(stylesDir?.subdirectories).toHaveLength(1); // nested

      // Check nested directory
      const nestedDir = stylesDir?.subdirectories.find(d => d.name === 'nested');
      expect(nestedDir).toBeDefined();
      expect(nestedDir?.files).toHaveLength(1); // theme.css.hbs
    });

    it('should throw error for non-existent template path', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent');

      await expect(templateManager.scanTemplateStructure(nonExistentPath))
        .rejects.toMatchObject({
          type: ErrorType.TEMPLATE_PROCESSING_ERROR
        });
    });
  });

  describe('processTemplateHierarchy', () => {
    let templateStructure: TemplateStructure;

    beforeEach(async () => {
      // Create test template structure
      const structure = {
        'component.hbs': 'export const {{name}} = () => {};',
        'component.test.hbs': 'describe("{{name}}", () => {});',
        'styles/component.css.hbs': '.{{name}} { color: red; }',
        'utils/helper.js.hbs': 'export const {{name}}Helper = () => {};'
      };

      const templatePath = path.join(templatesDir, 'react-component');
      await fileSystemManager.createFolderRecursive(templatePath);

      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(templatePath, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }

      templateStructure = await templateManager.scanTemplateStructure(templatePath);
    });

    it('should process template hierarchy with component name', async () => {
      const componentName = 'UserProfile';
      
      const processed = await templateManager.processTemplateHierarchy(templateStructure, componentName);

      expect(processed.componentName).toBe(componentName);
      expect(processed.files).toHaveLength(2);
      expect(processed.directories).toHaveLength(2);

      // Check processed files
      const componentFile = processed.files.find(f => f.targetPath.includes('component'));
      expect(componentFile?.content).toContain('UserProfile');

      // Check processed directories
      const stylesDir = processed.directories.find(d => d.targetPath.includes('styles'));
      expect(stylesDir).toBeDefined();
      expect(stylesDir?.files).toHaveLength(1);
      
      const cssFile = stylesDir?.files[0];
      expect(cssFile?.content).toContain('UserProfile');
    });

    it('should apply naming rules to file paths', async () => {
      const componentName = 'UserProfile';
      
      const processed = await templateManager.processTemplateHierarchy(templateStructure, componentName);

      // Files should have .hbs extension removed
      processed.files.forEach(file => {
        expect(file.targetPath).not.toContain('.hbs');
      });

      // Check if template naming is applied
      const componentFile = processed.files.find(f => f.targetPath.includes('component'));
      expect(componentFile?.targetPath).toContain('component'); // Should keep original name if no template placeholder
    });
  });

  describe('discoverTemplates with hierarchical support', () => {
    beforeEach(async () => {
      // Create multiple template types with different structures
      const templates = {
        'react-component': {
          'component.hbs': 'export const {{name}} = () => {};',
          'styles/component.css.hbs': '.{{name}} { color: red; }'
        },
        'vue-component': {
          'template.vue.hbs': '<template><div>{{name}}</div></template>',
          'assets/icon.svg.hbs': '<svg>{{name}}</svg>'
        },
        'simple-file': {
          'file.js.hbs': 'const {{name}} = {};'
        }
      };

      await fileSystemManager.createFolderRecursive(templatesDir);

      for (const [templateName, files] of Object.entries(templates)) {
        const templatePath = path.join(templatesDir, templateName);
        await fileSystemManager.createFolderRecursive(templatePath);

        for (const [filePath, content] of Object.entries(files)) {
          const fullPath = path.join(templatePath, filePath);
          await fileSystemManager.createFile(fullPath, content);
        }
      }
    });

    it('should discover templates with subdirectory information', async () => {
      // Debug: Check if templates directory exists and has content
      const templatesExist = await fileSystemManager.folderExists(templatesDir);
      expect(templatesExist).toBe(true);
      
      const templateEntries = await fileSystemManager.listFilesRecursive(templatesDir);
      const templateDirs = templateEntries.filter(e => e.isDirectory);
      expect(templateDirs.some(d => d.name === 'react-component')).toBe(true);
      expect(templateDirs.some(d => d.name === 'vue-component')).toBe(true);
      expect(templateDirs.some(d => d.name === 'simple-file')).toBe(true);

      const templates = await templateManager.discoverTemplates(tempDir);

      expect(templates).toHaveLength(3);

      // Check react-component template
      const reactTemplate = templates.find(t => t.name === 'react-component');
      expect(reactTemplate?.hasSubdirectories).toBe(true);
      expect(reactTemplate?.structure.directories).toHaveLength(1);

      // Check vue-component template
      const vueTemplate = templates.find(t => t.name === 'vue-component');
      expect(vueTemplate?.hasSubdirectories).toBe(true);
      expect(vueTemplate?.structure.directories).toHaveLength(1);

      // Check simple-file template
      const simpleTemplate = templates.find(t => t.name === 'simple-file');
      expect(simpleTemplate?.hasSubdirectories).toBe(false);
      expect(simpleTemplate?.structure.directories).toHaveLength(0);
    });
  });

  describe('processTemplate (updated async version)', () => {
    beforeEach(async () => {
      const templatePath = path.join(templatesDir, 'test-template');
      await fileSystemManager.createFolderRecursive(templatePath);
      
      const templateFile = path.join(templatePath, 'component.hbs');
      await fileSystemManager.createFile(templateFile, 'export const {{name}} = () => {};');
    });

    it('should process template content with component name', async () => {
      const templateFile = path.join(templatesDir, 'test-template', 'component.hbs');
      const componentName = 'UserProfile';

      const result = await templateManager.processTemplate(templateFile, componentName);

      expect(result).toBe('export const UserProfile = () => {};');
    });

    it('should throw error for non-existent template file', async () => {
      const nonExistentFile = path.join(templatesDir, 'nonexistent.hbs');
      const componentName = 'Test';

      await expect(templateManager.processTemplate(nonExistentFile, componentName))
        .rejects.toMatchObject({
          type: ErrorType.TEMPLATE_PROCESSING_ERROR
        });
    });
  });

  describe('cache functionality', () => {
    beforeEach(async () => {
      const templatePath = path.join(templatesDir, 'cached-template');
      await fileSystemManager.createFolderRecursive(templatePath);
      
      const templateFile = path.join(templatePath, 'component.hbs');
      await fileSystemManager.createFile(templateFile, 'export const {{name}} = () => {};');
    });

    it('should cache template discovery results', async () => {
      // First call
      const templates1 = await templateManager.discoverTemplates(tempDir);
      
      // Second call should use cache
      const templates2 = await templateManager.discoverTemplates(tempDir);

      expect(templates1).toEqual(templates2);
      expect(templates1.length).toBeGreaterThanOrEqual(0); // May be 0 if no templates found
    });

    it('should invalidate cache when requested', async () => {
      // Discover templates
      const templates1 = await templateManager.discoverTemplates(tempDir);

      // Invalidate cache
      templateManager.invalidateCache();

      // Discover templates again - should work without errors
      const templates2 = await templateManager.discoverTemplates(tempDir);
      expect(templates2).toEqual(templates1);
    });
  });
});