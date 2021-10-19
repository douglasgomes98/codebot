export function filterTemplatesFiles(files: string[]) {
  return files.filter(file => file.includes('.hbs'));
}
