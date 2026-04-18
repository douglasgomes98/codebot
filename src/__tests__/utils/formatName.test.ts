import { canBeFormatted, formatName } from '../../utils/formatName';

describe('formatName', () => {
  describe('pascal-case', () => {
    it('leaves PascalCase unchanged', () => {
      expect(formatName('Button', 'pascal-case')).toBe('Button');
      expect(formatName('MyComponent', 'pascal-case')).toBe('MyComponent');
    });

    it('converts lowercase to PascalCase', () => {
      expect(formatName('button', 'pascal-case')).toBe('Button');
    });

    it('converts kebab-case to PascalCase', () => {
      expect(formatName('my-button', 'pascal-case')).toBe('MyButton');
      expect(formatName('my-custom-card', 'pascal-case')).toBe('MyCustomCard');
    });

    it('converts camelCase to PascalCase', () => {
      expect(formatName('myButton', 'pascal-case')).toBe('MyButton');
    });

    it('converts snake_case to PascalCase', () => {
      expect(formatName('my_button', 'pascal-case')).toBe('MyButton');
    });

    it('returns empty string for empty input', () => {
      expect(formatName('', 'pascal-case')).toBe('');
    });
  });

  describe('kebab-case', () => {
    it('leaves kebab-case unchanged', () => {
      expect(formatName('my-button', 'kebab-case')).toBe('my-button');
    });

    it('converts PascalCase to kebab-case', () => {
      expect(formatName('MyButton', 'kebab-case')).toBe('my-button');
      expect(formatName('MyCustomCard', 'kebab-case')).toBe('my-custom-card');
    });

    it('converts camelCase to kebab-case', () => {
      expect(formatName('myButton', 'kebab-case')).toBe('my-button');
    });

    it('converts snake_case to kebab-case', () => {
      expect(formatName('my_button', 'kebab-case')).toBe('my-button');
    });

    it('converts lowercase to kebab-case (single word)', () => {
      expect(formatName('button', 'kebab-case')).toBe('button');
    });

    it('returns empty string for empty input', () => {
      expect(formatName('', 'kebab-case')).toBe('');
    });
  });

  describe('camel-case', () => {
    it('leaves camelCase unchanged', () => {
      expect(formatName('myButton', 'camel-case')).toBe('myButton');
    });

    it('converts PascalCase to camelCase', () => {
      expect(formatName('MyButton', 'camel-case')).toBe('myButton');
      expect(formatName('MyCustomCard', 'camel-case')).toBe('myCustomCard');
    });

    it('converts kebab-case to camelCase', () => {
      expect(formatName('my-button', 'camel-case')).toBe('myButton');
    });

    it('converts snake_case to camelCase', () => {
      expect(formatName('my_button', 'camel-case')).toBe('myButton');
    });

    it('converts lowercase to camelCase (single word)', () => {
      expect(formatName('button', 'camel-case')).toBe('button');
    });

    it('returns empty string for empty input', () => {
      expect(formatName('', 'camel-case')).toBe('');
    });
  });

  describe('snake-case', () => {
    it('leaves snake_case unchanged', () => {
      expect(formatName('my_button', 'snake-case')).toBe('my_button');
    });

    it('converts PascalCase to snake_case', () => {
      expect(formatName('MyButton', 'snake-case')).toBe('my_button');
      expect(formatName('MyCustomCard', 'snake-case')).toBe('my_custom_card');
    });

    it('converts kebab-case to snake_case', () => {
      expect(formatName('my-button', 'snake-case')).toBe('my_button');
    });

    it('converts camelCase to snake_case', () => {
      expect(formatName('myButton', 'snake-case')).toBe('my_button');
    });

    it('converts lowercase to snake_case (single word)', () => {
      expect(formatName('button', 'snake-case')).toBe('button');
    });

    it('returns empty string for empty input', () => {
      expect(formatName('', 'snake-case')).toBe('');
    });
  });

  describe('cross-format consistency', () => {
    it('all formats produce non-empty output for "my-package"', () => {
      expect(formatName('my-package', 'pascal-case')).toBe('MyPackage');
      expect(formatName('my-package', 'kebab-case')).toBe('my-package');
      expect(formatName('my-package', 'camel-case')).toBe('myPackage');
      expect(formatName('my-package', 'snake-case')).toBe('my_package');
    });
  });
});

describe('canBeFormatted', () => {
  it('returns true for a name starting with a lowercase letter', () => {
    expect(canBeFormatted('button')).toBe(true);
  });

  it('returns true for a name starting with an uppercase letter', () => {
    expect(canBeFormatted('Button')).toBe(true);
  });

  it('returns true for a kebab-case name', () => {
    expect(canBeFormatted('my-button')).toBe(true);
  });

  it('returns true for a snake_case name', () => {
    expect(canBeFormatted('my_button')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(canBeFormatted('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(canBeFormatted('   ')).toBe(false);
  });

  it('returns false for a name starting with a digit', () => {
    expect(canBeFormatted('1button')).toBe(false);
    expect(canBeFormatted('123')).toBe(false);
  });

  it('returns false for a name starting with a hyphen', () => {
    expect(canBeFormatted('-button')).toBe(false);
  });

  it('returns false for a name starting with an underscore', () => {
    expect(canBeFormatted('_button')).toBe(false);
  });

  it('trims leading whitespace before checking', () => {
    expect(canBeFormatted('  button')).toBe(true);
  });
});
