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

// Mock FileSystemManager
jest.mock('../../../managers/FileSystemManager', () => ({
  FileSystemManager: jest.fn().mockImplementation(() => ({
    folderExists: jest.fn().mockResolvedValue(true),
    listDirectories: jest.fn().mockResolvedValue(['ComponentTemplate']),
    listFiles: jest.fn().mockResolvedValue(['component.tsx.hbs', 'component.test.tsx.hbs']),
    readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
    listFilesRecursive: jest.fn().mockResolvedValue([
      { name: 'component.tsx.hbs', path: 'component.tsx.hbs', isDirectory: false },
      { name: 'component.test.tsx.hbs', path: 'component.test.tsx.hbs', isDirectory: false }
    ])
  }))
}));

// Mock DirectoryProcessor
jest.mock('../../../utils/DirectoryProcessor', () => ({
  DirectoryProcessor: jest.fn().mockImplementation(() => ({
    scanTemplateStructure: jest.fn().mockResolvedValue({
      rootPath: '/test/templates/ComponentTemplate',
      files: [
        { name: 'component.tsx.hbs', path: 'component.tsx.hbs', relativePath: 'component.tsx.hbs' },
        { name: 'component.test.tsx.hbs', path: 'component.test.tsx.hbs', relativePath: 'component.test.tsx.hbs' }
      ],
      directories: []
    }),
    validateDepth: jest.fn()
  }))
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
    
    // Mock successful template discovery
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.readdir as jest.Mock)
      .mockResolvedValue([
        { name: 'ComponentTemplate', isDirectory: () => true }
      ]);
    (mockFs.promises.readFile as jest.Mock).mockResolvedValue('Hello {{name}}!');
    
    mockHelpers.checkExistsFile.mockReturnValue(true);
    mockHelpers.showSearchDropdown.mockResolvedValue('ComponentTemplate');
    
    // Reset FileSystemManager mock to default successful state
    const MockedFileSystemManager = require('../../../managers/FileSystemManager').FileSystemManager;
    MockedFileSystemManager.mockClear();
    MockedFileSystemManager.mockImplementation(() => ({
      folderExists: jest.fn().mockResolvedValue(true),
      listDirectories: jest.fn().mockResolvedValue(['ComponentTemplate']),
      listFiles: jest.fn().mockResolvedValue(['component.tsx.hbs', 'component.test.tsx.hbs']),
      readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
      listFilesRecursive: jest.fn().mockResolvedValue([
        { name: 'component.tsx.hbs', path: 'component.tsx.hbs', isDirectory: false },
        { name: 'component.test.tsx.hbs', path: 'component.test.tsx.hbs', isDirectory: false }
      ])
    }));

    // Reset DirectoryProcessor mock to default successful state
    const MockedDirectoryProcessor = require('../../../utils/DirectoryProcessor').DirectoryProcessor;
    MockedDirectoryProcessor.mockClear();
    MockedDirectoryProcessor.mockImplementation(() => ({
      scanTemplateStructure: jest.fn().mockResolvedValue({
        rootPath: '/test/templates/ComponentTemplate',
        files: [
          { name: 'component.tsx.hbs', path: 'component.tsx.hbs', relativePath: 'component.tsx.hbs' },
          { name: 'component.test.tsx.hbs', path: 'component.test.tsx.hbs', relativePath: 'component.test.tsx.hbs' }
        ],
        directories: []
      }),
      validateDepth: jest.fn()
    }));
  });

  it('should successfully update a component with multi-project support', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

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

    // Mock FileSystemManager to return no templates
    const MockedFileSystemManager = require('../../../managers/FileSystemManager').FileSystemManager;
    MockedFileSystemManager.mockImplementation(() => ({
      folderExists: jest.fn().mockResolvedValue(false), // No template folder exists
      listDirectories: jest.fn().mockResolvedValue([]),
      listFiles: jest.fn().mockResolvedValue([]),
      readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
      listFilesRecursive: jest.fn().mockResolvedValue([])
    }));

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

    // Mock FileSystemManager to return no templates
    const MockedFileSystemManager = require('../../../managers/FileSystemManager').FileSystemManager;
    MockedFileSystemManager.mockImplementation(() => ({
      folderExists: jest.fn().mockResolvedValue(false), // No template folder exists
      listDirectories: jest.fn().mockResolvedValue([]),
      listFiles: jest.fn().mockResolvedValue([]),
      readFile: jest.fn().mockResolvedValue('Hello {{name}}!'),
      listFilesRecursive: jest.fn().mockResolvedValue([])
    }));

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('No templates found in project'),
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

    // Mock file existence: file1 exists, file2 and file3 don't exist
    mockHelpers.checkExistsFile
      .mockReturnValueOnce(true) // component folder exists
      .mockReturnValueOnce(true) // file1 exists (skip)
      .mockReturnValueOnce(false); // file2 doesn't exist (create)

    // Act
    await updateComponent(args);

    // Assert
    expect(mockHelpers.createFile).toHaveBeenCalledTimes(1); // Only file2
    expect(mockHelpers.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('1 files added, 1 files already exist'),
      'information'
    );
  });

  it('should show appropriate message when all files already exist', async () => {
    // Arrange
    const args = {
      fsPath: '/test/workspace/project1/components/MyComponent'
    };

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