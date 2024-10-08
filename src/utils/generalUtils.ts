export function replaceSpaceWithUnderscore(str: string): string {
  str = str.replace(/&/g, 'and');
  return str.replace(/\s+/g, '_').toLowerCase();
}

export function formatNumber(value: number, locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale).format(value);
}