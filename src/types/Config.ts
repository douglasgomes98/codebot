export type NameFormat =
  | 'pascal-case'
  | 'kebab-case'
  | 'camel-case'
  | 'snake-case';

export type TemplateSettings = {
  readonly nameFormat?: NameFormat;
};

export type CodebotConfig = {
  readonly templatesFolderPath: string;
  readonly templateSettings: Record<string, TemplateSettings>;
};

export const DEFAULT_TEMPLATES_FOLDER = 'templates';
export const DEFAULT_NAME_FORMAT: NameFormat = 'pascal-case';
export const NAME_FORMATS: readonly NameFormat[] = [
  'pascal-case',
  'kebab-case',
  'camel-case',
  'snake-case',
];
export const CONFIG_SECTION = 'codebot';
export const CONFIG_KEY_TEMPLATES_FOLDER = 'templatesFolderPath';
export const CONFIG_KEY_TEMPLATE_SETTINGS = 'templateSettings';
