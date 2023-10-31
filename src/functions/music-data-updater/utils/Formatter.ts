export function zeroPadding(value: number, length: number): string {
  return ('0'.repeat(length) + value.toString()).slice(-length);
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
