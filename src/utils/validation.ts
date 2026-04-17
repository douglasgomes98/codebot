import { COMPONENT_NAME_REGEX } from '../constants';

export function isValidComponentName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return COMPONENT_NAME_REGEX.test(name.trim());
}

export function sanitizeComponentName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

export function isValidPath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  const normalizedPath = filePath.replace(/\\/g, '/');
  return !normalizedPath.includes('../') && !normalizedPath.includes('./');
}

export function sanitizePath(filePath: string): string {
  return filePath.replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
}

export function isTemplateFile(filename: string): boolean {
  return filename.endsWith('.hbs');
}

export function removeTemplateExtension(filename: string): string {
  return filename.replace(/\.hbs$/, '');
}
