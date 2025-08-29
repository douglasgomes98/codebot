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
  files: ['Component.tsx.hbs', 'Component.module.scss.hbs', 'index.tsx.hbs']
};

export const mockSingleProjectContext: ProjectContext = {
  workspaceRoot: '/workspace',
  projectRoot: '/workspace',
  templatePath: '/workspace/templates',
  configPath: '/workspace/codebot.config.json',
  isMultiProject: false
};