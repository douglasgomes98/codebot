import { compileTemplate } from '../../../helpers/template/compileTemplate';

describe('compileTemplate', () => {
  it('replaces template variables with provided data', () => {
    const result = compileTemplate('export default function {{name}}() {}', {
      name: 'Button',
    });

    expect(result).toEqual({
      success: true,
      value: 'export default function Button() {}',
    });
  });

  it('replaces multiple occurrences of the same variable', () => {
    const template =
      'interface {{name}}Props {}\nexport const {{name}} = () => null';
    const result = compileTemplate(template, { name: 'Card' });

    expect(result).toEqual({
      success: true,
      value: 'interface CardProps {}\nexport const Card = () => null',
    });
  });

  it('supports multiple different variables', () => {
    const result = compileTemplate('{{name}} extends {{base}}', {
      name: 'Child',
      base: 'Parent',
    });

    expect(result).toEqual({ success: true, value: 'Child extends Parent' });
  });

  it('leaves template unchanged when data is empty object', () => {
    const result = compileTemplate('no variables here', {});

    expect(result).toEqual({ success: true, value: 'no variables here' });
  });

  it('compiles empty template string', () => {
    const result = compileTemplate('', {});

    expect(result).toEqual({ success: true, value: '' });
  });

  it('returns TEMPLATE_COMPILE_ERROR for invalid Handlebars syntax', () => {
    const result = compileTemplate('{{#if}}broken{{/each}}', {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('TEMPLATE_COMPILE_ERROR');
    }
  });

  it('preserves non-variable content', () => {
    const template = `import React from 'react'\n\nconst {{name}} = () => <div />`;
    const result = compileTemplate(template, { name: 'MyComp' });

    expect(result).toEqual({
      success: true,
      value: `import React from 'react'\n\nconst MyComp = () => <div />`,
    });
  });
});
