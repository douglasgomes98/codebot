export const removeTemplateExtension = (filename: string): string =>
  filename.endsWith('.hbs') ? filename.slice(0, -4) : filename;
