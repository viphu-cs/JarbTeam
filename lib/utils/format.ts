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

/**
 * Format message bubble timestamps (e.g., "14:32", "เมื่อวาน 14:32" / "Yesterday 14:32")
 */
export function formatMessageTime(
  dateInput: string | Date | undefined | null,
  locale: string = 'th'
): string {
  if (!dateInput) return '';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const isThisYear = d.getFullYear() === now.getFullYear();

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return timeStr;
    }

    if (isYesterday) {
      return locale === 'th' ? `เมื่อวาน ${timeStr}` : `Yesterday ${timeStr}`;
    }

    const localeCode = locale === 'th' ? 'th-TH' : 'en-US';
    const datePart = d.toLocaleDateString(localeCode, {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    });

    return `${datePart} ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Format conversation list item time (e.g. "เมื่อสักครู่", "2m", "14:32", "เมื่อวาน", "12 ก.ย.")
 */
export function formatConversationTime(
  dateInput: string | Date | undefined | null,
  locale: string = 'th'
): string {
  if (!dateInput) return '';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 60) {
      return locale === 'th' ? 'เมื่อสักครู่' : 'Just now';
    }

    if (diffMin < 60) {
      return `${diffMin}m`;
    }

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return timeStr;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return locale === 'th' ? 'เมื่อวาน' : 'Yesterday';
    }

    const isThisYear = d.getFullYear() === now.getFullYear();
    const localeCode = locale === 'th' ? 'th-TH' : 'en-US';
    return d.toLocaleDateString(localeCode, {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return '';
  }
}

