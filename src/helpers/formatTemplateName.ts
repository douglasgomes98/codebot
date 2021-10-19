import { formatToPascalCase } from './formatToPascalCase';

export function formatTemplateName(
  name: string,
  templateType: string,
  componentName: string,
) {
  return name
    .replace(templateType, formatToPascalCase(componentName))
    .replace('.hbs', '');
}
