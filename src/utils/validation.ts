import { COMPONENT_NAME_REGEX } from '../constants';

export class ValidationUtils {
  static isValidComponentName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    return COMPONENT_NAME_REGEX.test(name.trim());
  }

  static sanitizeComponentName(name: string): string {
    return name.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  }

  static isValidPath(path: string): boolean {
    if (!path || typeof path !== 'string') {
      return false;
    }

    // Check for path traversal attempts
    const normalizedPath = path.replace(/\\/g, '/');
    return !normalizedPath.includes('../') && !normalizedPath.includes('./');
  }

  static sanitizePath(path: string): string {
    return path.replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
  }

  static isTemplateFile(filename: string): boolean {
    return filename.endsWith('.hbs');
  }

  static removeTemplateExtension(filename: string): string {
    return filename.replace(/\.hbs$/, '');
  }
}