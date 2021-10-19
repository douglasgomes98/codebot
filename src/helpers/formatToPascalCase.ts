export function formatToPascalCase(str: string) {
  return str
    .split(' ')
    .map(item => item.charAt(0).toUpperCase() + item.slice(1))
    .join('');
}
