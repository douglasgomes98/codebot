import { formatToPascalCase } from '../../utils/formatToPascalCase';

describe('formatToPascalCase', () => {
  describe('already PascalCase', () => {
    it('leaves PascalCase unchanged', () => {
      expect(formatToPascalCase('Button')).toBe('Button');
      expect(formatToPascalCase('MyComponent')).toBe('MyComponent');
    });
  });

  describe('lowercase input', () => {
    it('capitalizes a single word', () => {
      expect(formatToPascalCase('button')).toBe('Button');
      expect(formatToPascalCase('card')).toBe('Card');
    });
  });

  describe('kebab-case input', () => {
    it('converts kebab-case to PascalCase', () => {
      expect(formatToPascalCase('my-button')).toBe('MyButton');
      expect(formatToPascalCase('my-custom-card')).toBe('MyCustomCard');
    });
  });

  describe('snake_case input', () => {
    it('converts snake_case to PascalCase', () => {
      expect(formatToPascalCase('my_button')).toBe('MyButton');
      expect(formatToPascalCase('MY_BUTTON')).toBe('MyButton');
    });
  });

  describe('camelCase input', () => {
    it('converts camelCase to PascalCase', () => {
      expect(formatToPascalCase('myComponent')).toBe('MyComponent');
      expect(formatToPascalCase('myCustomCard')).toBe('MyCustomCard');
    });
  });

  describe('mixed separators', () => {
    it('handles spaces and mixed separators', () => {
      expect(formatToPascalCase('my button')).toBe('MyButton');
      expect(formatToPascalCase('my-custom_card')).toBe('MyCustomCard');
    });
  });

  describe('names with numbers', () => {
    it('keeps trailing numbers attached to the word', () => {
      expect(formatToPascalCase('button2')).toBe('Button2');
      expect(formatToPascalCase('h1-heading')).toBe('H1Heading');
    });
  });

  describe('whitespace handling', () => {
    it('trims leading and trailing whitespace', () => {
      expect(formatToPascalCase('  button  ')).toBe('Button');
    });
  });

  describe('invalid input', () => {
    it('returns empty string for empty input', () => {
      expect(formatToPascalCase('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(formatToPascalCase('   ')).toBe('');
    });

    it('preserves digit-only words without a leading letter', () => {
      expect(formatToPascalCase('123')).toBe('123');
    });
  });
});
