export function parseLocalDate(dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(dateValue);
  }

  return new Date(year, month - 1, day);
}
