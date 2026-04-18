import { renameTemplateFile } from './renameTemplateFile';

/**
 * Resolves the output path for a generated file by applying naming rules
 * to the filename portion only, preserving subdirectory structure.
 *
 * Examples (templateName = "ComponentSass", componentName = "Button"):
 *   "ComponentSass.tsx"     → "Button.tsx"
 *   "index.tsx"             → "index.tsx"
 *   "src/App.tsx"           → "src/App.tsx"
 *   "src/lib/main.tsx"      → "src/lib/main.tsx"
 *
 * Path traversal segments (`..`, `.`) are stripped defensively.
 */
export const resolveTargetPath = (
  relativePath: string,
  templateName: string,
  componentName: string,
): string => {
  const segments = relativePath
    .split('/')
    .filter(s => s !== '..' && s !== '.' && s !== '');

  const filename = segments[segments.length - 1] ?? '';
  const renamedFilename = renameTemplateFile(
    filename,
    templateName,
    componentName,
  );
  return [...segments.slice(0, -1), renamedFilename].join('/');
};
