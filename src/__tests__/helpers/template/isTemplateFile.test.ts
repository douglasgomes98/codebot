import { isTemplateFile } from '../../../helpers/template/isTemplateFile';

describe('isTemplateFile', () => {
  it('returns true for .hbs files', () => {
    expect(isTemplateFile('Button.tsx.hbs')).toBe(true);
    expect(isTemplateFile('index.ts.hbs')).toBe(true);
    expect(isTemplateFile('styles.css.hbs')).toBe(true);
    expect(isTemplateFile('.hbs')).toBe(true);
  });

  it('returns false for non-.hbs files', () => {
    expect(isTemplateFile('Button.tsx')).toBe(false);
    expect(isTemplateFile('index.ts')).toBe(false);
    expect(isTemplateFile('Button.hbs.tsx')).toBe(false);
    expect(isTemplateFile('')).toBe(false);
  });

  it('is case-sensitive (.HBS is not a template file)', () => {
    expect(isTemplateFile('Button.HBS')).toBe(false);
    expect(isTemplateFile('index.Hbs')).toBe(false);
  });
});
