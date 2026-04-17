import type { ProjectContext } from '../../../types';
import { PathResolver } from '../../../utils/PathResolver';

describe('PathResolver Integration Tests', () => {
  let pathResolver: PathResolver;

  beforeEach(() => {
    pathResolver = new PathResolver();
  });

  describe('Multi-project workspace scenarios', () => {
    it('should resolve paths correctly for nested project structure', () => {
      const nestedProjectContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/apps/frontend',
        templatePath: '/workspace/apps/frontend/templates',
        configPath: '/workspace/apps/frontend/codebot.config.json',
        isMultiProject: true,
        projectName: 'frontend',
      };

      const templatePath = pathResolver.resolveTemplatePath(
        nestedProjectContext,
        'ReactComponent',
      );
      expect(templatePath).toBe(
        '/workspace/apps/frontend/templates/ReactComponent',
      );

      const targetPath = pathResolver.resolveTargetPath(
        nestedProjectContext,
        'MyComponent',
      );
      expect(targetPath).toBe('/workspace/apps/frontend/MyComponent');

      const configPath = pathResolver.resolveConfigPath(nestedProjectContext);
      expect(configPath).toBe('/workspace/apps/frontend/codebot.config.json');
    });

    it('should resolve paths correctly for monorepo with packages', () => {
      const packageProjectContext: ProjectContext = {
        workspaceRoot: '/monorepo',
        projectRoot: '/monorepo/packages/ui-components',
        templatePath: '/monorepo/packages/ui-components/templates',
        configPath: '/monorepo/packages/ui-components/codebot.config.json',
        isMultiProject: true,
        projectName: 'ui-components',
      };

      const templatePath = pathResolver.resolveTemplatePath(
        packageProjectContext,
        'Component',
      );
      expect(templatePath).toBe(
        '/monorepo/packages/ui-components/templates/Component',
      );

      const relativePath = pathResolver.resolveRelativePath(
        packageProjectContext,
        'src/components',
      );
      expect(relativePath).toBe(
        '/monorepo/packages/ui-components/src/components',
      );
    });

    it('should handle deeply nested project structures', () => {
      const deepProjectContext: ProjectContext = {
        workspaceRoot: '/company',
        projectRoot: '/company/projects/web/apps/admin/modules/user-management',
        templatePath:
          '/company/projects/web/apps/admin/modules/user-management/templates',
        configPath:
          '/company/projects/web/apps/admin/modules/user-management/codebot.config.json',
        isMultiProject: true,
        projectName: 'user-management',
      };

      const targetPath = pathResolver.resolveTargetPath(
        deepProjectContext,
        'UserProfile',
      );
      expect(targetPath).toBe(
        '/company/projects/web/apps/admin/modules/user-management/UserProfile',
      );

      // Ensure boundary validation works with deep paths
      expect(() => {
        pathResolver.resolveRelativePath(
          deepProjectContext,
          '../../../../../malicious',
        );
      }).toThrow();
    });
  });

  describe('Single project workspace scenarios', () => {
    it('should resolve paths correctly for simple single project', () => {
      const singleProjectContext: ProjectContext = {
        workspaceRoot: '/simple-app',
        projectRoot: '/simple-app',
        templatePath: '/simple-app/templates',
        configPath: '/simple-app/codebot.config.json',
        isMultiProject: false,
      };

      const templatePath = pathResolver.resolveTemplatePath(
        singleProjectContext,
        'Component',
      );
      expect(templatePath).toBe('/simple-app/templates/Component');

      const targetPath = pathResolver.resolveTargetPath(
        singleProjectContext,
        'MyComponent',
      );
      expect(targetPath).toBe('/simple-app/MyComponent');
    });

    it('should handle single project with complex folder structure', () => {
      const complexSingleProject: ProjectContext = {
        workspaceRoot: '/complex-app',
        projectRoot: '/complex-app',
        templatePath: '/complex-app/templates',
        configPath: '/complex-app/codebot.config.json',
        isMultiProject: false,
      };

      const relativePath = pathResolver.resolveRelativePath(
        complexSingleProject,
        'src/features/auth/components',
      );
      expect(relativePath).toBe('/complex-app/src/features/auth/components');
    });
  });

  describe('Edge cases and security', () => {
    it('should prevent path traversal across project boundaries', () => {
      const restrictedContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/project-a',
        templatePath: '/workspace/project-a/templates',
        configPath: '/workspace/project-a/codebot.config.json',
        isMultiProject: true,
        projectName: 'project-a',
      };

      // These should all throw errors due to path traversal attempts
      expect(() => {
        pathResolver.resolveRelativePath(
          restrictedContext,
          '../project-b/secrets',
        );
      }).toThrow();

      expect(() => {
        pathResolver.resolveRelativePath(restrictedContext, '../../etc/passwd');
      }).toThrow();

      expect(() => {
        pathResolver.resolveTargetPath(restrictedContext, '../../../malicious');
      }).toThrow();
    });

    it('should handle Windows-style paths in multi-project setup', () => {
      const windowsContext: ProjectContext = {
        workspaceRoot: 'C:\\workspace',
        projectRoot: 'C:\\workspace\\project1',
        templatePath: 'C:\\workspace\\project1\\templates',
        configPath: 'C:\\workspace\\project1\\codebot.config.json',
        isMultiProject: true,
        projectName: 'project1',
      };

      const targetPath = pathResolver.resolveTargetPath(
        windowsContext,
        'Component',
      );
      expect(targetPath).toContain('Component');
      expect(targetPath).toContain('project1');
    });

    it('should sanitize component names while preserving project structure', () => {
      const projectContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/frontend',
        templatePath: '/workspace/frontend/templates',
        configPath: '/workspace/frontend/codebot.config.json',
        isMultiProject: true,
        projectName: 'frontend',
      };

      const targetPath = pathResolver.resolveTargetPath(
        projectContext,
        'My<Component>Name',
      );
      expect(targetPath).toBe('/workspace/frontend/My_Component_Name');

      const templatePath = pathResolver.resolveTemplatePath(
        projectContext,
        'React|Component',
      );
      expect(templatePath).toBe(
        '/workspace/frontend/templates/React_Component',
      );
    });

    it('should handle Unicode characters in project paths', () => {
      const unicodeContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/项目-α',
        templatePath: '/workspace/项目-α/templates',
        configPath: '/workspace/项目-α/codebot.config.json',
        isMultiProject: true,
        projectName: '项目-α',
      };

      const targetPath = pathResolver.resolveTargetPath(
        unicodeContext,
        'Component测试',
      );
      expect(targetPath).toBe('/workspace/项目-α/Component测试');
    });
  });

  describe('Performance and limits', () => {
    it('should handle reasonable number of nested folders', () => {
      const deepContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/project',
        templatePath: '/workspace/project/templates',
        configPath: '/workspace/project/codebot.config.json',
        isMultiProject: false,
      };

      const deepPath =
        'src/features/auth/components/forms/inputs/text/validation/rules';
      const resolvedPath = pathResolver.resolveRelativePath(
        deepContext,
        deepPath,
      );
      expect(resolvedPath).toBe(
        '/workspace/project/src/features/auth/components/forms/inputs/text/validation/rules',
      );
    });

    it('should reject excessively long component names', () => {
      const context: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/project',
        templatePath: '/workspace/project/templates',
        configPath: '/workspace/project/codebot.config.json',
        isMultiProject: false,
      };

      const veryLongName = `Component${'A'.repeat(250)}`; // 259 characters
      expect(() => {
        pathResolver.resolveTargetPath(context, veryLongName);
      }).toThrow();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should normalize paths consistently across platforms', () => {
      const mixedSeparatorContext: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/project',
        templatePath: '/workspace/project/templates',
        configPath: '/workspace/project/codebot.config.json',
        isMultiProject: false,
      };

      // Test mixed separators
      const mixedPath = pathResolver.resolveRelativePath(
        mixedSeparatorContext,
        'src\\components/forms',
      );
      expect(mixedPath).toBe('/workspace/project/src/components/forms');
    });

    it('should handle case sensitivity appropriately', () => {
      const context: ProjectContext = {
        workspaceRoot: '/workspace',
        projectRoot: '/workspace/Project',
        templatePath: '/workspace/Project/templates',
        configPath: '/workspace/Project/codebot.config.json',
        isMultiProject: false,
      };

      const upperPath = pathResolver.resolveTargetPath(context, 'COMPONENT');
      const lowerPath = pathResolver.resolveTargetPath(context, 'component');

      expect(upperPath).not.toBe(lowerPath);
      expect(upperPath).toContain('COMPONENT');
      expect(lowerPath).toContain('component');
    });
  });
});
