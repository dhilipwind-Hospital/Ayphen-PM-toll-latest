import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

/**
 * Date formatting utilities for consistent date display across the app
 */

// Standard date formats
export const DATE_FORMATS = {
    DATE_ONLY: 'MMM D, YYYY',           // Dec 19, 2025
    DATE_SHORT: 'MMM D',                 // Dec 19
    DATE_FULL: 'MMMM D, YYYY',          // December 19, 2025
    DATE_TIME: 'MMM D, YYYY h:mm A',    // Dec 19, 2025 10:30 AM
    TIME_ONLY: 'h:mm A',                 // 10:30 AM
    ISO_DATE: 'YYYY-MM-DD',              // 2025-12-19
    SPRINT_DATE: 'MMM D',                // Dec 19
};

/**
 * Format a date to the standard date format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = dayjs(date);
    return d.isValid() ? d.format(DATE_FORMATS.DATE_ONLY) : '-';
};

/**
 * Format a date to date and time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = dayjs(date);
    return d.isValid() ? d.format(DATE_FORMATS.DATE_TIME) : '-';
};

/**
 * Format a date to time only
 */
export const formatTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = dayjs(date);
    return d.isValid() ? d.format(DATE_FORMATS.TIME_ONLY) : '-';
};

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = dayjs(date);
    return d.isValid() ? d.fromNow() : '-';
};

/**
 * Format a date for sprint display (short format)
 */
export const formatSprintDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = dayjs(date);
    return d.isValid() ? d.format(DATE_FORMATS.SPRINT_DATE) : '-';
};

/**
 * Format a date range for sprints
 */
export const formatDateRange = (
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined
): string => {
    const start = formatSprintDate(startDate);
    const end = formatSprintDate(endDate);
    if (start === '-' && end === '-') return '-';
    if (start === '-') return `Until ${end}`;
    if (end === '-') return `From ${start}`;
    return `${start} - ${end}`;
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dueDate: string | Date | null | undefined): boolean => {
    if (!dueDate) return false;
    return dayjs(dueDate).isBefore(dayjs(), 'day');
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date | null | undefined): boolean => {
    if (!date) return false;
    return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Get days until due date (negative if overdue)
 */
export const getDaysUntilDue = (dueDate: string | Date | null | undefined): number | null => {
    if (!dueDate) return null;
    return dayjs(dueDate).diff(dayjs(), 'day');
};

export default {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    formatSprintDate,
    formatDateRange,
    isOverdue,
    isToday,
    getDaysUntilDue,
    DATE_FORMATS,
};
