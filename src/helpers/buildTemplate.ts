import * as handlebars from 'handlebars';
import { formatToPascalCase } from './formatToPascalCase';
import { readFile } from './readFile';

export function buildTemplate(path: string, componentName: string) {
  const currentTemplate = handlebars.compile(readFile(path));

  return currentTemplate({
    name: formatToPascalCase(componentName),
  });
}
