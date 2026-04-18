import { renameTemplateFile } from '../../../helpers/template/renameTemplateFile';

describe('renameTemplateFile', () => {
  describe('replacing template folder name', () => {
    it('replaces template name at the start of the filename', () => {
      expect(
        renameTemplateFile('ComponentSass.tsx', 'ComponentSass', 'Button'),
      ).toBe('Button.tsx');
    });

    it('replaces template name preserving compound extensions', () => {
      expect(
        renameTemplateFile(
          'ComponentSass.module.scss',
          'ComponentSass',
          'Button',
        ),
      ).toBe('Button.module.scss');
      expect(
        renameTemplateFile('ComponentSass.spec.tsx', 'ComponentSass', 'Button'),
      ).toBe('Button.spec.tsx');
    });

    it('replaces template name in the middle of the filename', () => {
      expect(
        renameTemplateFile('StoriesTsx.stories.tsx', 'StoriesTsx', 'Button'),
      ).toBe('Button.stories.tsx');
    });

    it('replaces ComponentTailwind with double extension style', () => {
      expect(
        renameTemplateFile(
          'ComponentTailwind.style.ts',
          'ComponentTailwind',
          'Card',
        ),
      ).toBe('Card.style.ts');
    });
  });

  describe('replacing "Template" literal fallback', () => {
    it('replaces "Template" when template name is not found', () => {
      expect(
        renameTemplateFile('Template.tsx', 'ComponentSass', 'Button'),
      ).toBe('Button.tsx');
    });

    it('replaces "Template" in compound filenames', () => {
      expect(
        renameTemplateFile('Template.stories.tsx', 'MyTemplate', 'Card'),
      ).toBe('Card.stories.tsx');
    });
  });

  describe('files that should not be renamed', () => {
    it('returns index.tsx unchanged', () => {
      expect(renameTemplateFile('index.tsx', 'ComponentSass', 'Button')).toBe(
        'index.tsx',
      );
    });

    it('returns styles.ts unchanged (ComponentStyled)', () => {
      expect(renameTemplateFile('styles.ts', 'ComponentSyled', 'Button')).toBe(
        'styles.ts',
      );
    });

    it('returns static config files unchanged', () => {
      expect(renameTemplateFile('package.json', 'ReactPackage', 'MyApp')).toBe(
        'package.json',
      );
      expect(renameTemplateFile('tsconfig.json', 'ReactPackage', 'MyApp')).toBe(
        'tsconfig.json',
      );
      expect(
        renameTemplateFile('vite.config.ts', 'ReactPackage', 'MyApp'),
      ).toBe('vite.config.ts');
    });

    it('returns index.html unchanged', () => {
      expect(renameTemplateFile('index.html', 'ReactPackage', 'MyApp')).toBe(
        'index.html',
      );
    });
  });
});
