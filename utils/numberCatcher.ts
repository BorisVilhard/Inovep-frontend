export function numberCatcher(input: string): string {
  if (!isNaN(parseFloat(input)) && isFinite(Number(input))) {
    return '';
  } else {
    return input;
  }
}
