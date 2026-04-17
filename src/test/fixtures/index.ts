import { ConfigurationFile, ProjectContext, TemplateType } from '../../types';

export const mockConfiguration: ConfigurationFile = {
  templateFolderPath: 'templates',
  multiProject: {
    enabled: true,
    projectDetection: 'auto'
  }
};

export const mockProjectContext: ProjectContext = {
  workspaceRoot: '/workspace',
  projectRoot: '/workspace/project1',
  templatePath: '/workspace/project1/templates',
  configPath: '/workspace/project1/codebot.config.json',
  isMultiProject: true,
  projectName: 'project1'
};

export const mockTemplateType: TemplateType = {
  name: 'ComponentSass',
  path: '/workspace/templates/ComponentSass',
  files: ['Component.tsx.hbs', 'Component.module.scss.hbs', 'index.tsx.hbs'],
  hasSubdirectories: false,
  structure: {
    rootPath: '/workspace/templates/ComponentSass',
    files: [
      {
        name: 'Component.tsx.hbs',
        path: '/workspace/templates/ComponentSass/Component.tsx.hbs',
        relativePath: 'Component.tsx.hbs',
        extension: '.hbs'
      },
      {
        name: 'Component.module.scss.hbs',
        path: '/workspace/templates/ComponentSass/Component.module.scss.hbs',
        relativePath: 'Component.module.scss.hbs',
        extension: '.hbs'
      },
      {
        name: 'index.tsx.hbs',
        path: '/workspace/templates/ComponentSass/index.tsx.hbs',
        relativePath: 'index.tsx.hbs',
        extension: '.hbs'
      }
    ],
    directories: []
  }
};

export const mockSingleProjectContext: ProjectContext = {
  workspaceRoot: '/workspace',
  projectRoot: '/workspace',
  templatePath: '/workspace/templates',
  configPath: '/workspace/codebot.config.json',
  isMultiProject: false
};