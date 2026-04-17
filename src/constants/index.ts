export const DEFAULT_TEMPLATE_FOLDER = 'templates';
export const CONFIG_FILE_NAME = 'codebot.config.json';
export const TEMPLATE_FILE_EXTENSION = '.hbs';

export const DEFAULT_CONFIGURATION = {
  templateFolderPath: DEFAULT_TEMPLATE_FOLDER,
  multiProject: {
    enabled: true,
    projectDetection: 'auto' as const,
  },
};

export const SUPPORTED_TEMPLATE_EXTENSIONS = ['.hbs'];
export const COMPONENT_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export const ERROR_MESSAGES = {
  WORKSPACE_NOT_FOUND: 'Workspace path not found!',
  INVALID_COMPONENT_NAME: 'Invalid component name!',
  TEMPLATE_FOLDER_EMPTY: 'Templates folder is empty!',
  TEMPLATE_NOT_FOUND: 'Template folder not found!',
  INVALID_TEMPLATE_TYPE: 'Invalid template type!',
} as const;
