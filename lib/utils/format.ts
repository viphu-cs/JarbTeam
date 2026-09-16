/**
 * Locale-aware date and number formatting helpers for JarbTeam.
 */

export function formatDate(
  dateInput: string | Date | undefined | null,
  locale: string = 'th',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const localeCode = locale === 'th' ? 'th-TH' : 'en-US';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };

    return d.toLocaleDateString(localeCode, defaultOptions);
  } catch {
    return String(dateInput);
  }
}
