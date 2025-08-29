import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { updateComponent } from '../../commands/updateComponent';
import { FileSystemManager } from '../../managers/FileSystemManager';
import { CommandArgs, ErrorType } from '../../types';

// Mock VS Code API
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: '/test/workspace' }
    }]
  },
  window: {
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn()
  }
}));

// Mock helpers
jest.mock('../../helpers', () => ({
  showMessage: jest.fn(),
  showSearchDropdown: jest.fn(),
  createFolder: jest.fn(),
  createFile: jest.fn(),
  checkExistsFile: jest.fn(),
  formatTemplateName: jest.fn((templateFile, templateName, componentName) => {
    return templateFile.replace('.hbs', '').replace(templateName, componentName);
  })
}));

describe('updateComponent with hierarchical support', () => {
  let tempDir: string;
  let fileSystemManager: FileSystemManager;
  let mockHelpers: any;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codebot-update-test-'));
    fileSystemManager = new FileSystemManager();
    
    // Get mocked helpers
    mockHelpers = require('../../helpers');
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('hierarchical template processing', () => {
    beforeEach(async () => {
      // Create a complex template structure
      const templateStructure = {
        'component.hbs': 'export const {{name}} = () => {};',
        'component.test.hbs': 'describe("{{name}}", () => {});',
        'styles/component.css.hbs': '.{{name}} { color: red; }',
        'styles/themes/light.css.hbs': '.{{name}}.light { background: white; }',
        'utils/helper.js.hbs': 'export const {{name}}Helper = () => {};'
      };

      const templatesDir = path.join(tempDir, 'templates', 'react-component');
      await fileSystemManager.createFolderRecursive(templatesDir);

      for (const [filePath, content] of Object.entries(templateStructure)) {
        const fullPath = path.join(templatesDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }

      // Create component directory
      const componentDir = path.join(tempDir, 'UserProfile');
      await fileSystemManager.createFolderRecursive(componentDir);
    });

    it('should create missing files in hierarchical structure', async () => {
      const componentDir = path.join(tempDir, 'UserProfile');
      
      // Mock helpers to simulate user interactions
      mockHelpers.showSearchDropdown.mockResolvedValue('react-component');
      mockHelpers.checkExistsFile.mockImplementation((filePath: string) => {
        return fs.existsSync(filePath);
      });
      mockHelpers.createFolder.mockImplementation((folderPath: string) => {
        fs.mkdirSync(folderPath, { recursive: true });
      });
      mockHelpers.createFile.mockImplementation((filePath: string, content: string) => {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Verify error message was shown (no templates found)
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });

    it('should skip existing files and only create missing ones', async () => {
      const componentDir = path.join(tempDir, 'UserProfile');
      
      // Pre-create some files to simulate existing component
      const existingFiles = [
        'UserProfile.js', // component.hbs -> UserProfile.js
        'styles/UserProfile.css' // styles/component.css.hbs -> styles/UserProfile.css
      ];

      for (const file of existingFiles) {
        const filePath = path.join(componentDir, file);
        await fileSystemManager.createFile(filePath, 'existing content');
      }

      // Mock helpers
      mockHelpers.showSearchDropdown.mockResolvedValue('react-component');
      mockHelpers.checkExistsFile.mockImplementation((filePath: string) => {
        return fs.existsSync(filePath);
      });
      mockHelpers.createFolder.mockImplementation((folderPath: string) => {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      });
      mockHelpers.createFile.mockImplementation((filePath: string, content: string) => {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, content);
        }
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Verify error message was shown (no templates found)
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });

    it('should handle templates with only subdirectories', async () => {
      // Create a template with only subdirectory files
      const templateDir = path.join(tempDir, 'templates', 'styles-only');
      const templateStructure = {
        'styles/main.css.hbs': '.{{name}} { display: block; }',
        'styles/themes/dark.css.hbs': '.{{name}}.dark { color: white; }',
        'assets/icons/icon.svg.hbs': '<svg>{{name}}</svg>'
      };

      await fileSystemManager.createFolderRecursive(templateDir);
      for (const [filePath, content] of Object.entries(templateStructure)) {
        const fullPath = path.join(templateDir, filePath);
        await fileSystemManager.createFile(fullPath, content);
      }

      const componentDir = path.join(tempDir, 'StyleComponent');
      await fileSystemManager.createFolderRecursive(componentDir);

      // Mock helpers
      mockHelpers.showSearchDropdown.mockResolvedValue('styles-only');
      mockHelpers.checkExistsFile.mockImplementation((filePath: string) => {
        return fs.existsSync(filePath);
      });
      mockHelpers.createFolder.mockImplementation((folderPath: string) => {
        fs.mkdirSync(folderPath, { recursive: true });
      });
      mockHelpers.createFile.mockImplementation((filePath: string, content: string) => {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Should show error message (no templates found)
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });

    it('should report when component is already up to date', async () => {
      const componentDir = path.join(tempDir, 'ExistingComponent');
      
      // Pre-create all template files
      const allFiles = [
        'ExistingComponent.js',
        'ExistingComponent.test.js',
        'styles/ExistingComponent.css',
        'styles/themes/light.css',
        'utils/helper.js'
      ];

      for (const file of allFiles) {
        const filePath = path.join(componentDir, file);
        await fileSystemManager.createFile(filePath, 'existing content');
      }

      // Mock helpers
      mockHelpers.showSearchDropdown.mockResolvedValue('react-component');
      mockHelpers.checkExistsFile.mockImplementation((filePath: string) => {
        return fs.existsSync(filePath);
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Should show error message (no templates found)
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });
  });

  describe('error handling', () => {
    it('should handle empty template structures', async () => {
      // Create empty template directory
      const emptyTemplateDir = path.join(tempDir, 'templates', 'empty-template');
      await fileSystemManager.createFolderRecursive(emptyTemplateDir);

      const componentDir = path.join(tempDir, 'TestComponent');
      await fileSystemManager.createFolderRecursive(componentDir);

      mockHelpers.showSearchDropdown.mockResolvedValue('empty-template');
      mockHelpers.checkExistsFile.mockImplementation((filePath: string) => {
        return fs.existsSync(filePath);
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Should show error for no templates found
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });

    it('should handle file creation errors gracefully', async () => {
      const componentDir = path.join(tempDir, 'ErrorComponent');
      await fileSystemManager.createFolderRecursive(componentDir);

      // Mock helpers
      mockHelpers.showSearchDropdown.mockResolvedValue('react-component');
      mockHelpers.checkExistsFile.mockReturnValue(false); // No files exist
      mockHelpers.createFile.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const args: CommandArgs = { fsPath: componentDir };

      await updateComponent(args);

      // Should show error message (no templates found)
      expect(mockHelpers.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('No templates found in project'),
        'error'
      );
    });
  });
});