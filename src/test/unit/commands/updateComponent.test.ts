import * as path from 'path';
import * as fs from 'fs';
import { updateComponent } from '../../../commands/updateComponent';

// Mock VS Code module
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/test/workspace'
        }
      }
    ]
  }
}));

// Mock helpers
jest.mock('../../../helpers', () => ({
  showMessage: jest.fn(),
  showSearchDropdown: jest.fn(),
  createFolder: jest.fn(),
  createFile: jest.fn(),
  checkExistsFile: jest.fn(),
  formatTemplateName: jest.fn((templateFile, templateType, componentName) => {
    return templateFile.replace('.hbs', '').replace(templateType, componentName);
  }),
}));

// Mock fs operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
  }
}));

describe('updateComponent', () => {
  const mockHelpers = require('../../../helpers');
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    (mockFs.readdirSync as jest.Mock).mockReturnValue(['ComponentTemplate']);
    mockFs.readFileSync.mockReturnValue('{"templateFolderPath": "templates"}');
    
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.readdir as jest.Mock).mockResolvedValue([
      { name: 'ComponentTemplate', isDirectory: () => true }
    ]);
    (mockFs.promises.readFile as jest.Mock).mockResolvedValue('Hello {{name}}!');
    
    mockHelpers.checkExistsFile.mockReturnValue(true);
    mockHelpers.showSearchDropdown.mockResolvedValue('ComponentTemplate');
  });

  it('should successfully update a component with multi-project support', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

    // Mock template files
    (mockFs.readdirSync as jest.Mock).mockReturnValueOnce(['ComponentTemplate']) // template types
      .mockReturnValueOnce(['component.tsx.hbs', 'component.test.tsx.hbs']); // template files

    // Mock that one file exists, one doesn't
    mockHelpers.checkExistsFile
      .mockReturnValueOnce(true) // component folder exists
      .mockReturnValueOnce(true) // first file exists (skip)
      .mockReturnValueOnce(false); // second file doesn't exist (create)

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.createFile).toHaveBeenCalledTimes(1);
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining("Component 'MyComponent' updated successfully!"),
      'information'
    );
  });

  it('should handle case when no templates are found', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

    // Mock empty templates
    (mockFs.promises.readdir as jest.Mock).mockResolvedValue([]);

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('No templates found in project'),
      'error'
    );
  });

  it('should handle invalid component name', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/'
    };

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('Cannot determine component name'),
      'error'
    );
  });

  it('should handle missing folder path', async () => {
    // Arrange
    const args = {};

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('No folder path provided'),
      'error'
    );
  });

  it('should skip existing files and only create missing ones', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

    // Mock template files
    (mockFs.readdirSync as jest.Mock).mockReturnValueOnce(['ComponentTemplate'])
      .mockReturnValueOnce(['file1.tsx.hbs', 'file2.tsx.hbs', 'file3.tsx.hbs']);

    // Mock file existence: file1 exists, file2 and file3 don't exist
    mockHelpers.checkExistsFile
      .mockReturnValueOnce(true) // component folder exists
      .mockReturnValueOnce(true) // file1 exists (skip)
      .mockReturnValueOnce(false) // file2 doesn't exist (create)
      .mockReturnValueOnce(false); // file3 doesn't exist (create)

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.createFile).toHaveBeenCalledTimes(2); // Only file2 and file3
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('2 files added, 1 files already exist'),
      'information'
    );
  });

  it('should show appropriate message when all files already exist', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

    // Mock template files
    (mockFs.readdirSync as jest.Mock).mockReturnValueOnce(['ComponentTemplate'])
      .mockReturnValueOnce(['file1.tsx.hbs', 'file2.tsx.hbs']);

    // Mock all files exist
    mockHelpers.checkExistsFile.mockReturnValue(true);

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.createFile).not.toHaveBeenCalled();
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('is already up to date'),
      'information'
    );
  });
});