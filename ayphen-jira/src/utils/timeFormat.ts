/**
 * Time Format Utilities
 * Matches Jira's time parsing and formatting exactly
 * 
 * Supported formats: "2h 30m", "1d", "1w 2d 3h 30m", etc.
 * Conversion rules:
 * - 1 week = 5 working days
 * - 1 day = 8 working hours
 * - 1 hour = 60 minutes
 */

export interface TimeComponents {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
}

// Jira default working time configuration
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 8;  // Jira default working hours per day
const DAYS_PER_WEEK = 5;  // Jira default working days per week

/**
 * Parse time string to minutes
 * Supports: "2h 30m", "1d", "1w 2d 3h 30m", "0.5d", etc.
 * 
 * @param input - Time string in Jira format
 * @returns Total minutes as integer
 */
export function parseTimeString(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return 0;
  
  // Match patterns: 1w, 2d, 3h, 30m (with optional decimals)
  const weekMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*w/);
  const dayMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*d/);
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m(?!in)/); // Avoid matching 'min' in 'minutes'
  
  let totalMinutes = 0;
  
  if (weekMatch) {
    totalMinutes += parseFloat(weekMatch[1]) * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (dayMatch) {
    totalMinutes += parseFloat(dayMatch[1]) * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * MINUTES_PER_HOUR;
  }
  if (minuteMatch) {
    totalMinutes += parseFloat(minuteMatch[1]);
  }
  
  return Math.round(totalMinutes);
}

/**
 * Format minutes to Jira time string
 * Output: "1w 2d 3h 30m" (omits zero values)
 * 
 * @param minutes - Total minutes
 * @returns Formatted time string
 */
export function formatMinutesToTimeString(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes === 0) return '0m';
  
  let remaining = Math.abs(minutes);
  const isNegative = minutes < 0;
  
  const weeks = Math.floor(remaining / (DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= weeks * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const days = Math.floor(remaining / (HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= days * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  remaining -= hours * MINUTES_PER_HOUR;
  
  const mins = Math.round(remaining);
  
  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  const result = parts.join(' ');
  return isNegative ? `-${result}` : result;
}

/**
 * Format minutes to short display (for compact UI)
 * Output: "2h 30m" or "1d 4h" (without weeks)
 */
export function formatMinutesToShortString(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes === 0) return '0m';
  
  let remaining = Math.abs(minutes);
  const isNegative = minutes < 0;
  
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  remaining -= hours * MINUTES_PER_HOUR;
  
  const mins = Math.round(remaining);
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  const result = parts.join(' ');
  return isNegative ? `-${result}` : result;
}

/**
 * Validate time string format
 * 
 * @param input - Time string to validate
 * @returns true if valid Jira time format
 */
export function isValidTimeString(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return false;
  
  // Pattern: one or more of (number + unit) separated by optional spaces
  // Valid units: w, d, h, m
  const pattern = /^(\d+(?:\.\d+)?\s*[wdhm]\s*)+$/;
  return pattern.test(trimmed);
}

/**
 * Get time components from minutes
 * 
 * @param minutes - Total minutes
 * @returns Object with weeks, days, hours, minutes
 */
export function getTimeComponents(minutes: number): TimeComponents {
  let remaining = Math.abs(minutes);
  
  const weeks = Math.floor(remaining / (DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= weeks * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const days = Math.floor(remaining / (HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= days * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  remaining -= hours * MINUTES_PER_HOUR;
  
  const mins = Math.round(remaining);
  
  return { weeks, days, hours, minutes: mins };
}

/**
 * Convert time components to minutes
 * 
 * @param components - Time components object
 * @returns Total minutes
 */
export function componentsToMinutes(components: Partial<TimeComponents>): number {
  let total = 0;
  
  if (components.weeks) {
    total += components.weeks * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (components.days) {
    total += components.days * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (components.hours) {
    total += components.hours * MINUTES_PER_HOUR;
  }
  if (components.minutes) {
    total += components.minutes;
  }
  
  return Math.round(total);
}

/**
 * Calculate progress percentage
 * 
 * @param timeSpent - Time spent in minutes
 * @param originalEstimate - Original estimate in minutes
 * @returns Progress percentage (0-100+)
 */
export function calculateProgress(timeSpent: number, originalEstimate: number | null): number {
  if (!originalEstimate || originalEstimate <= 0) return 0;
  return Math.round((timeSpent / originalEstimate) * 100);
}

/**
 * Check if over budget
 * 
 * @param timeSpent - Time spent in minutes
 * @param originalEstimate - Original estimate in minutes
 * @returns true if time spent exceeds original estimate
 */
export function isOverBudget(timeSpent: number, originalEstimate: number | null): boolean {
  if (!originalEstimate || originalEstimate <= 0) return false;
  return timeSpent > originalEstimate;
}

/**
 * Format minutes to decimal hours (for reports)
 * 
 * @param minutes - Total minutes
 * @returns Decimal hours string (e.g., "2.5h")
 */
export function formatMinutesToDecimalHours(minutes: number): string {
  if (!minutes || minutes === 0) return '0h';
  const hours = minutes / MINUTES_PER_HOUR;
  return `${hours.toFixed(1)}h`;
}
