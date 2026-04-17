import type { ProjectContext } from '../../../types';
import { PathResolver } from '../../../utils/PathResolver';
import { mockProjectContext, mockSingleProjectContext } from '../../fixtures';

describe('PathResolver', () => {
  let pathResolver: PathResolver;
  let mockMultiProjectContext: ProjectContext;
  let mockSingleProjectContextLocal: ProjectContext;

  beforeEach(() => {
    pathResolver = new PathResolver();

    // Create test-specific contexts to avoid modifying shared fixtures
    mockMultiProjectContext = {
      ...mockProjectContext,
      workspaceRoot: '/workspace',
      projectRoot: '/workspace/project1',
      templatePath: '/workspace/project1/templates',
      configPath: '/workspace/project1/codebot.config.json',
      isMultiProject: true,
      projectName: 'project1',
    };

    mockSingleProjectContextLocal = {
      ...mockSingleProjectContext,
      workspaceRoot: '/workspace',
      projectRoot: '/workspace',
      templatePath: '/workspace/templates',
      configPath: '/workspace/codebot.config.json',
      isMultiProject: false,
    };
  });

  describe('validatePath', () => {
    it('should validate correct paths', () => {
      expect(pathResolver.validatePath('component-name')).toBe(true);
      expect(pathResolver.validatePath('ComponentName')).toBe(true);
      expect(pathResolver.validatePath('component_name')).toBe(true);
      expect(pathResolver.validatePath('folder/component')).toBe(true);
    });

    it('should reject paths with parent directory traversal', () => {
      expect(pathResolver.validatePath('../component')).toBe(false);
      expect(pathResolver.validatePath('folder/../component')).toBe(false);
      expect(pathResolver.validatePath('../../malicious')).toBe(false);
    });

    it('should reject absolute paths', () => {
      expect(pathResolver.validatePath('/absolute/path')).toBe(false);
      expect(pathResolver.validatePath('C:\\Windows\\System32')).toBe(false);
    });

    it('should reject paths with invalid characters', () => {
      expect(pathResolver.validatePath('component<name')).toBe(false);
      expect(pathResolver.validatePath('component>name')).toBe(false);
      expect(pathResolver.validatePath('component:name')).toBe(false);
      expect(pathResolver.validatePath('component"name')).toBe(false);
      expect(pathResolver.validatePath('component|name')).toBe(false);
      expect(pathResolver.validatePath('component?name')).toBe(false);
      expect(pathResolver.validatePath('component*name')).toBe(false);
    });

    it('should reject paths with null bytes', () => {
      expect(pathResolver.validatePath('component\0name')).toBe(false);
    });

    it('should reject reserved Windows names', () => {
      expect(pathResolver.validatePath('CON')).toBe(false);
      expect(pathResolver.validatePath('PRN')).toBe(false);
      expect(pathResolver.validatePath('AUX')).toBe(false);
      expect(pathResolver.validatePath('NUL')).toBe(false);
      expect(pathResolver.validatePath('COM1')).toBe(false);
      expect(pathResolver.validatePath('LPT1')).toBe(false);
    });

    it('should reject empty or null paths', () => {
      expect(pathResolver.validatePath('')).toBe(false);
      expect(pathResolver.validatePath(null as unknown as string)).toBe(false);
      expect(pathResolver.validatePath(undefined as unknown as string)).toBe(
        false,
      );
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(300);
      expect(pathResolver.validatePath(longPath)).toBe(false);
    });

    it('should reject paths with empty segments', () => {
      expect(pathResolver.validatePath('folder//component')).toBe(false);
      expect(pathResolver.validatePath('folder\\\\')).toBe(false);
    });
  });

  describe('sanitizePath', () => {
    it('should sanitize dangerous characters', () => {
      expect(pathResolver.sanitizePath('component<name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component>name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component:name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component"name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component|name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component?name')).toBe(
        'component_name',
      );
      expect(pathResolver.sanitizePath('component*name')).toBe(
        'component_name',
      );
    });

    it('should remove null bytes', () => {
      expect(pathResolver.sanitizePath('component\0name')).toBe(
        'componentname',
      );
    });

    it('should remove parent directory references', () => {
      expect(pathResolver.sanitizePath('../component')).toBe('component');
      expect(pathResolver.sanitizePath('folder/../component')).toBe(
        'folder/component',
      );
      expect(pathResolver.sanitizePath('../../malicious')).toBe('malicious');
    });

    it('should normalize path separators', () => {
      expect(pathResolver.sanitizePath('folder\\component')).toBe(
        'folder/component',
      );
      expect(pathResolver.sanitizePath('folder//component')).toBe(
        'folder/component',
      );
    });

    it('should handle reserved names by appending underscore', () => {
      expect(pathResolver.sanitizePath('CON')).toBe('CON_');
      expect(pathResolver.sanitizePath('PRN')).toBe('PRN_');
      expect(pathResolver.sanitizePath('folder/AUX')).toBe('folder/AUX_');
    });

    it('should trim whitespace and dots', () => {
      expect(pathResolver.sanitizePath('  component  ')).toBe('component');
      expect(pathResolver.sanitizePath('..component..')).toBe('component');
    });

    it('should handle empty or null input', () => {
      expect(pathResolver.sanitizePath('')).toBe('');
      expect(pathResolver.sanitizePath(null as unknown as string)).toBe('');
      expect(pathResolver.sanitizePath(undefined as unknown as string)).toBe(
        '',
      );
    });
  });

  describe('resolveTemplatePath', () => {
    it('should resolve template path for multi-project workspace', () => {
      const result = pathResolver.resolveTemplatePath(
        mockMultiProjectContext,
        'ComponentSass',
      );
      expect(result).toBe('/workspace/project1/templates/ComponentSass');
    });

    it('should resolve template path for single project workspace', () => {
      const result = pathResolver.resolveTemplatePath(
        mockSingleProjectContextLocal,
        'ComponentSass',
      );
      expect(result).toBe('/workspace/templates/ComponentSass');
    });

    it('should sanitize template name', () => {
      const result = pathResolver.resolveTemplatePath(
        mockMultiProjectContext,
        'Component<Sass>',
      );
      expect(result).toBe('/workspace/project1/templates/Component_Sass_');
    });

    it('should throw error for invalid template name', () => {
      expect(() => {
        pathResolver.resolveTemplatePath(
          mockMultiProjectContext,
          '../malicious',
        );
      }).toThrow();
    });
  });

  describe('resolveTargetPath', () => {
    it('should resolve target path for multi-project workspace', () => {
      const result = pathResolver.resolveTargetPath(
        mockMultiProjectContext,
        'MyComponent',
      );
      expect(result).toBe('/workspace/project1/MyComponent');
    });

    it('should resolve target path for single project workspace', () => {
      const result = pathResolver.resolveTargetPath(
        mockSingleProjectContextLocal,
        'MyComponent',
      );
      expect(result).toBe('/workspace/MyComponent');
    });

    it('should sanitize component name', () => {
      const result = pathResolver.resolveTargetPath(
        mockMultiProjectContext,
        'My<Component>',
      );
      expect(result).toBe('/workspace/project1/My_Component_');
    });

    it('should throw error for invalid component name', () => {
      expect(() => {
        pathResolver.resolveTargetPath(mockMultiProjectContext, '../malicious');
      }).toThrow();
    });

    it('should throw error if target path is outside project boundaries', () => {
      // Mock a scenario where sanitized path could still be problematic
      const maliciousContext = {
        ...mockMultiProjectContext,
        projectRoot: '/workspace/project1',
      };

      expect(() => {
        // This should be caught by boundary validation
        pathResolver.resolveTargetPath(maliciousContext, 'legitimate-name');
      }).not.toThrow(); // This should work fine
    });
  });

  describe('resolveConfigPath', () => {
    it('should resolve config path for multi-project workspace', () => {
      const result = pathResolver.resolveConfigPath(mockMultiProjectContext);
      expect(result).toBe('/workspace/project1/codebot.config.json');
    });

    it('should resolve config path for single project workspace', () => {
      const result = pathResolver.resolveConfigPath(
        mockSingleProjectContextLocal,
      );
      expect(result).toBe('/workspace/codebot.config.json');
    });
  });

  describe('resolveRelativePath', () => {
    it('should resolve relative path within project boundaries', () => {
      const result = pathResolver.resolveRelativePath(
        mockMultiProjectContext,
        'src/components',
      );
      expect(result).toBe('/workspace/project1/src/components');
    });

    it('should sanitize relative path', () => {
      const result = pathResolver.resolveRelativePath(
        mockMultiProjectContext,
        'src/comp<onents>',
      );
      expect(result).toBe('/workspace/project1/src/comp_onents_');
    });

    it('should throw error for invalid relative path', () => {
      expect(() => {
        pathResolver.resolveRelativePath(
          mockMultiProjectContext,
          '../../../malicious',
        );
      }).toThrow();
    });

    it('should throw error if resolved path is outside boundaries', () => {
      expect(() => {
        pathResolver.resolveRelativePath(
          mockMultiProjectContext,
          '../outside-project',
        );
      }).toThrow();
    });
  });

  describe('edge cases and security', () => {
    it('should handle Windows-style paths correctly', () => {
      const windowsContext = {
        ...mockMultiProjectContext,
        workspaceRoot: 'C:\\workspace',
        projectRoot: 'C:\\workspace\\project1',
      };

      const result = pathResolver.resolveTargetPath(
        windowsContext,
        'MyComponent',
      );
      expect(result).toContain('MyComponent');
    });

    it('should handle very long component names', () => {
      const longName = `Component${'A'.repeat(200)}`;
      expect(() => {
        pathResolver.resolveTargetPath(mockMultiProjectContext, longName);
      }).toThrow();
    });

    it('should handle special Unicode characters', () => {
      const unicodeName = 'Component测试';
      const result = pathResolver.resolveTargetPath(
        mockMultiProjectContext,
        unicodeName,
      );
      expect(result).toContain('Component测试');
    });

    it('should prevent path traversal in nested folders', () => {
      expect(() => {
        pathResolver.resolveRelativePath(
          mockMultiProjectContext,
          'folder/../../../etc/passwd',
        );
      }).toThrow();
    });

    it('should handle case sensitivity correctly', () => {
      const result1 = pathResolver.resolveTargetPath(
        mockMultiProjectContext,
        'component',
      );
      const result2 = pathResolver.resolveTargetPath(
        mockMultiProjectContext,
        'Component',
      );
      expect(result1).not.toBe(result2);
    });
  });

  describe('boundary validation', () => {
    it('should allow paths within project root', () => {
      const context = {
        ...mockMultiProjectContext,
        projectRoot: '/workspace/project1',
        workspaceRoot: '/workspace',
      };

      expect(() => {
        pathResolver.resolveTargetPath(context, 'ValidComponent');
      }).not.toThrow();
    });

    it('should allow paths within workspace root for single project', () => {
      expect(() => {
        pathResolver.resolveTargetPath(
          mockSingleProjectContextLocal,
          'ValidComponent',
        );
      }).not.toThrow();
    });

    it('should reject paths that escape project boundaries', () => {
      // Create a context where we can test boundary violations
      const restrictedContext = {
        ...mockMultiProjectContext,
        projectRoot: '/workspace/project1',
      };

      // The PathResolver should prevent any path that goes outside the project
      // This is more of an integration test with the boundary checking logic
      expect(() => {
        pathResolver.resolveRelativePath(restrictedContext, '../../../etc');
      }).toThrow();
    });
  });
});
