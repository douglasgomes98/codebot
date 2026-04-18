import * as vscode from 'vscode';
import { readConfig } from '../../../helpers/config/readConfig';

const mockGetConfiguration = vscode.workspace
  .getConfiguration as jest.MockedFunction<
  typeof vscode.workspace.getConfiguration
>;

const mockGet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetConfiguration.mockReturnValue({
    get: mockGet,
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn(),
  } as unknown as vscode.WorkspaceConfiguration);
});

describe('readConfig', () => {
  describe('templatesFolderPath', () => {
    it('returns the configured value when set', () => {
      mockGet.mockReturnValue('custom/templates');

      const config = readConfig();

      expect(config.templatesFolderPath).toBe('custom/templates');
    });

    it('returns default "templates" when setting is not defined', () => {
      mockGet.mockReturnValue(undefined);

      const config = readConfig();

      expect(config.templatesFolderPath).toBe('templates');
    });

    it('calls getConfiguration with "codebot" section', () => {
      mockGet.mockReturnValue('templates');

      readConfig();

      expect(mockGetConfiguration).toHaveBeenCalledWith('codebot', undefined);
    });

    it('passes scope URI to getConfiguration when provided', () => {
      const uri = vscode.Uri.file('/workspace/my-package');
      mockGet.mockReturnValue('templates');

      readConfig(uri);

      expect(mockGetConfiguration).toHaveBeenCalledWith('codebot', uri);
    });

    it('reads the correct key from the configuration', () => {
      mockGet.mockReturnValue('src/templates');

      readConfig();

      expect(mockGet).toHaveBeenCalledWith('templatesFolderPath');
    });
  });

  describe('return shape', () => {
    it('returns a frozen-compatible plain object', () => {
      mockGet.mockReturnValue('templates');

      const config = readConfig();

      expect(config).toEqual({ templatesFolderPath: 'templates' });
      expect(typeof config).toBe('object');
    });
  });
});
