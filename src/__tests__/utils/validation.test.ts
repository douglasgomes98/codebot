import {
  COMPONENT_NAME_ERROR,
  formatToPascalCase,
  isValidComponentName,
} from '../../utils/validation';

describe('isValidComponentName', () => {
  describe('validates already-formatted (PascalCase) names', () => {
    it('accepts a PascalCase name', () => {
      expect(isValidComponentName('Button')).toBe(true);
    });

    it('accepts a single uppercase letter', () => {
      expect(isValidComponentName('A')).toBe(true);
    });

    it('accepts names with numbers after the first letter', () => {
      expect(isValidComponentName('Button2')).toBe(true);
      expect(isValidComponentName('H1Heading')).toBe(true);
    });

    it('accepts multi-word PascalCase', () => {
      expect(isValidComponentName('MyComponent')).toBe(true);
    });
  });

  describe('rejects non-PascalCase or invalid names', () => {
    it('rejects empty string', () => {
      expect(isValidComponentName('')).toBe(false);
    });

    it('rejects names starting with a digit', () => {
      expect(isValidComponentName('1Button')).toBe(false);
      expect(isValidComponentName('1invalid')).toBe(false);
    });

    it('rejects lowercase names (use formatToPascalCase first)', () => {
      expect(isValidComponentName('button')).toBe(false);
    });

    it('rejects names with hyphens (use formatToPascalCase first)', () => {
      expect(isValidComponentName('my-button')).toBe(false);
    });

    it('rejects names with underscores (use formatToPascalCase first)', () => {
      expect(isValidComponentName('my_button')).toBe(false);
    });

    it('rejects names with spaces', () => {
      expect(isValidComponentName('My Button')).toBe(false);
    });

    it('rejects names with dots', () => {
      expect(isValidComponentName('Button.tsx')).toBe(false);
    });

    it('rejects names with slashes', () => {
      expect(isValidComponentName('src/Button')).toBe(false);
    });
  });

  describe('typical command flow: format then validate', () => {
    it('accepts "button" after formatting', () => {
      expect(isValidComponentName(formatToPascalCase('button'))).toBe(true);
    });

    it('accepts "my-card" after formatting', () => {
      expect(isValidComponentName(formatToPascalCase('my-card'))).toBe(true);
    });

    it('accepts "myComponent" after formatting', () => {
      expect(isValidComponentName(formatToPascalCase('myComponent'))).toBe(
        true,
      );
    });

    it('rejects "123" even after formatting (no leading letter)', () => {
      expect(isValidComponentName(formatToPascalCase('123'))).toBe(false);
    });
  });
});

describe('COMPONENT_NAME_ERROR', () => {
  it('is a non-empty string', () => {
    expect(typeof COMPONENT_NAME_ERROR).toBe('string');
    expect(COMPONENT_NAME_ERROR.length).toBeGreaterThan(0);
  });
});
