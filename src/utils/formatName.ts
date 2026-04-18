import type { NameFormat } from '../types/Config';

const splitWords = (input: string): string[] =>
  input
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

export const formatName = (input: string, format: NameFormat): string => {
  const words = splitWords(input);
  if (words.length === 0) return '';

  switch (format) {
    case 'pascal-case':
      return words.map(capitalize).join('');
    case 'kebab-case':
      return words.map(w => w.toLowerCase()).join('-');
    case 'camel-case':
      return [words[0].toLowerCase(), ...words.slice(1).map(capitalize)].join(
        '',
      );
    case 'snake-case':
      return words.map(w => w.toLowerCase()).join('_');
  }
};

export const canBeFormatted = (input: string): boolean =>
  /^[a-zA-Z]/.test(input.trim());
