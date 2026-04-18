import { formatToPascalCase } from './formatToPascalCase';

export { formatToPascalCase };

const COMPONENT_NAME_RE = /^[A-Z][A-Za-z0-9]*$/;

export const isValidComponentName = (name: string): boolean =>
  COMPONENT_NAME_RE.test(name);

export const COMPONENT_NAME_ERROR =
  'Must start with a letter. Try "Button", "my-card", or "myComponent".';
