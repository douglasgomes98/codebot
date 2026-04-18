import * as vscode from 'vscode';
import { getNameFormat, readConfig } from '../../../helpers/config/readConfig';

const mockGetConfiguration = vscode.workspace
  .getConfiguration as jest.MockedFunction<
  typeof vscode.workspace.getConfiguration
>;

const mockGet = jest.fn();

const setupGet = (
  templatesFolderPath: string | undefined,
  templateSettings: Record<string, { nameFormat?: string }> | undefined = {},
) => {
  mockGet.mockImplementation((key: string) => {
    if (key === 'templatesFolderPath') return templatesFolderPath;
    if (key === 'templateSettings') return templateSettings;
    return undefined;
  });
};

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
      setupGet('custom/templates');

      const config = readConfig();

      expect(config.templatesFolderPath).toBe('custom/templates');
    });

    it('returns default "templates" when setting is not defined', () => {
      setupGet(undefined);

      const config = readConfig();

      expect(config.templatesFolderPath).toBe('templates');
    });

    it('calls getConfiguration with "codebot" section', () => {
      setupGet('templates');

      readConfig();

      expect(mockGetConfiguration).toHaveBeenCalledWith('codebot', undefined);
    });

    it('passes scope URI to getConfiguration when provided', () => {
      const uri = vscode.Uri.file('/workspace/my-package');
      setupGet('templates');

      readConfig(uri);

      expect(mockGetConfiguration).toHaveBeenCalledWith('codebot', uri);
    });

    it('reads the correct key from the configuration', () => {
      setupGet('src/templates');

      readConfig();

      expect(mockGet).toHaveBeenCalledWith('templatesFolderPath');
    });
  });

  describe('templateSettings', () => {
    it('returns the configured templateSettings when set', () => {
      setupGet('templates', { ReactPackage: { nameFormat: 'kebab-case' } });

      const config = readConfig();

      expect(config.templateSettings).toEqual({
        ReactPackage: { nameFormat: 'kebab-case' },
      });
    });

    it('returns empty object when templateSettings is not defined', () => {
      setupGet('templates', undefined);

      const config = readConfig();

      expect(config.templateSettings).toEqual({});
    });

    it('reads the correct key from the configuration', () => {
      setupGet('templates');

      readConfig();

      expect(mockGet).toHaveBeenCalledWith('templateSettings');
    });
  });

  describe('return shape', () => {
    it('returns an object with both fields', () => {
      setupGet('templates', {});

      const config = readConfig();

      expect(config).toEqual({
        templatesFolderPath: 'templates',
        templateSettings: {},
      });
      expect(typeof config).toBe('object');
    });
  });
});

describe('getNameFormat', () => {
  it('returns the configured nameFormat for a known template', () => {
    const config = {
      templatesFolderPath: 'templates',
      templateSettings: { ReactPackage: { nameFormat: 'kebab-case' as const } },
    };

    expect(getNameFormat(config, 'ReactPackage')).toBe('kebab-case');
  });

  it('returns "pascal-case" when template has no nameFormat', () => {
    const config = {
      templatesFolderPath: 'templates',
      templateSettings: { ReactPackage: {} },
    };

    expect(getNameFormat(config, 'ReactPackage')).toBe('pascal-case');
  });

  it('returns "pascal-case" when template is not in templateSettings', () => {
    const config = {
      templatesFolderPath: 'templates',
      templateSettings: {},
    };

    expect(getNameFormat(config, 'UnknownTemplate')).toBe('pascal-case');
  });

  it('returns the correct format for each supported NameFormat', () => {
    const formats = [
      'pascal-case',
      'kebab-case',
      'camel-case',
      'snake-case',
    ] as const;

    for (const nameFormat of formats) {
      const config = {
        templatesFolderPath: 'templates',
        templateSettings: { MyTemplate: { nameFormat } },
      };
      expect(getNameFormat(config, 'MyTemplate')).toBe(nameFormat);
    }
  });
});
