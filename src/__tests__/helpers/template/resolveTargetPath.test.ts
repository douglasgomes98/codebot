import { resolveTargetPath } from '../../../helpers/template/resolveTargetPath';

describe('resolveTargetPath', () => {
  describe('ComponentSass template (4 files)', () => {
    const T = 'ComponentSass';
    const C = 'Button';

    it('renames ComponentSass.tsx → Button.tsx', () => {
      expect(resolveTargetPath('ComponentSass.tsx', T, C)).toBe('Button.tsx');
    });

    it('renames ComponentSass.module.scss → Button.module.scss', () => {
      expect(resolveTargetPath('ComponentSass.module.scss', T, C)).toBe(
        'Button.module.scss',
      );
    });

    it('renames ComponentSass.spec.tsx → Button.spec.tsx', () => {
      expect(resolveTargetPath('ComponentSass.spec.tsx', T, C)).toBe(
        'Button.spec.tsx',
      );
    });

    it('leaves index.tsx unchanged', () => {
      expect(resolveTargetPath('index.tsx', T, C)).toBe('index.tsx');
    });
  });

  describe('ComponentTailwind template (3 files)', () => {
    const T = 'ComponentTailwind';
    const C = 'Card';

    it('renames ComponentTailwind.tsx → Card.tsx', () => {
      expect(resolveTargetPath('ComponentTailwind.tsx', T, C)).toBe('Card.tsx');
    });

    it('renames ComponentTailwind.style.ts → Card.style.ts', () => {
      expect(resolveTargetPath('ComponentTailwind.style.ts', T, C)).toBe(
        'Card.style.ts',
      );
    });

    it('leaves index.tsx unchanged', () => {
      expect(resolveTargetPath('index.tsx', T, C)).toBe('index.tsx');
    });
  });

  describe('StoriesTsx template (1 file)', () => {
    it('renames StoriesTsx.stories.tsx → Button.stories.tsx', () => {
      expect(
        resolveTargetPath('StoriesTsx.stories.tsx', 'StoriesTsx', 'Button'),
      ).toBe('Button.stories.tsx');
    });
  });

  describe('ReactPackage template (nested dirs)', () => {
    const T = 'ReactPackage';
    const C = 'MyPackage';

    it('preserves root-level static files unchanged', () => {
      expect(resolveTargetPath('package.json', T, C)).toBe('package.json');
      expect(resolveTargetPath('index.html', T, C)).toBe('index.html');
      expect(resolveTargetPath('vite.config.ts', T, C)).toBe('vite.config.ts');
    });

    it('preserves nested path structure for src/ files', () => {
      expect(resolveTargetPath('src/App.tsx', T, C)).toBe('src/App.tsx');
      expect(resolveTargetPath('src/main.tsx', T, C)).toBe('src/main.tsx');
    });

    it('preserves deeply nested path structure for src/lib/', () => {
      expect(resolveTargetPath('src/lib/main.tsx', T, C)).toBe(
        'src/lib/main.tsx',
      );
    });
  });

  describe('path integrity', () => {
    it('only renames the filename, never the directory segments', () => {
      expect(
        resolveTargetPath(
          'ComponentSass/nested/ComponentSass.tsx',
          'ComponentSass',
          'Button',
        ),
      ).toBe('ComponentSass/nested/Button.tsx');
    });
  });

  describe('path traversal safety', () => {
    it('strips .. segments, preserving remaining path', () => {
      expect(
        resolveTargetPath('../../etc/passwd', 'ComponentSass', 'Button'),
      ).toBe('etc/passwd');
    });

    it('strips . segments', () => {
      expect(resolveTargetPath('./index.tsx', 'ComponentSass', 'Button')).toBe(
        'index.tsx',
      );
    });

    it('strips leading empty segments from absolute paths', () => {
      expect(
        resolveTargetPath('/absolute/path/file.tsx', 'ComponentSass', 'Button'),
      ).toBe('absolute/path/file.tsx');
    });
  });
});
