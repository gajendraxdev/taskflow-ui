import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

/** Returns YYYY-MM-DD */
export const getFormattedDate = (dt: string): string => {
  if (!dt) return '';
  const date = new Date(dt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

/** Returns DD-MM-YYYY */
export const getFormattedDateDMY = (dt: string): string => {
  if (!dt) return '';
  const date = new Date(dt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/** Returns "Today", "Tomorrow", "Yesterday", or "1st January 2025" */
export const prettyDate = (dt: string): string => {
  if (!dt) return '';
  const date = new Date(dt);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'do MMMM yyyy');
};

/** Returns "1 January 2025, 3:30 PM" */
export const fullDateTime = (dt: string): string => {
  if (!dt) return '';
  return format(new Date(dt), 'd MMMM yyyy, h:mm a');
};
