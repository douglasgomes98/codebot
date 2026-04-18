import { removeTemplateExtension } from '../../../helpers/template/removeTemplateExtension';

describe('removeTemplateExtension', () => {
  it('removes .hbs extension from template file names', () => {
    expect(removeTemplateExtension('Button.tsx.hbs')).toBe('Button.tsx');
    expect(removeTemplateExtension('index.ts.hbs')).toBe('index.ts');
    expect(removeTemplateExtension('styles.css.hbs')).toBe('styles.css');
  });

  it('removes only the trailing .hbs extension', () => {
    expect(removeTemplateExtension('.hbs')).toBe('');
  });

  it('returns the filename unchanged when it has no .hbs extension', () => {
    expect(removeTemplateExtension('Button.tsx')).toBe('Button.tsx');
    expect(removeTemplateExtension('index.ts')).toBe('index.ts');
    expect(removeTemplateExtension('')).toBe('');
  });

  it('does not remove .hbs when it is not at the end', () => {
    expect(removeTemplateExtension('Button.hbs.tsx')).toBe('Button.hbs.tsx');
    expect(removeTemplateExtension('my.hbs.component.ts')).toBe(
      'my.hbs.component.ts',
    );
  });
});
