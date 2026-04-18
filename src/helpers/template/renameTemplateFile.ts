/**
 * Renames a template filename by replacing the template folder name
 * (or the literal "Template") with the component name.
 *
 * Examples (templateName = "ComponentSass", componentName = "Button"):
 *   "ComponentSass.tsx"         → "Button.tsx"
 *   "ComponentSass.module.scss" → "Button.module.scss"
 *   "ComponentSass.spec.tsx"    → "Button.spec.tsx"
 *   "index.tsx"                 → "index.tsx"  (no match, unchanged)
 */
export const renameTemplateFile = (
  filename: string,
  templateName: string,
  componentName: string,
): string => {
  if (filename.includes(templateName)) {
    return filename.replace(templateName, componentName);
  }
  if (filename.includes('Template')) {
    return filename.replace('Template', componentName);
  }
  return filename;
};
