export function parseTimeToHundredths(timeStr: string): number | null {
  const trimmed = timeStr.trim().replace(/\s/g, '');

  const withMinutes = /^(\d+):(\d{1,2})\.?(\d{0,2})$/;
  const withoutMinutes = /^(\d+)\.?(\d{0,2})$/;

  let match = trimmed.match(withMinutes);
  if (match) {
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const cents = parseInt((match[3] || '0').padEnd(2, '0'), 10);
    if (secs >= 60) return null;
    return (mins * 60 + secs) * 100 + cents;
  }

  match = trimmed.match(withoutMinutes);
  if (match) {
    const secs = parseInt(match[1], 10);
    const cents = parseInt((match[2] || '0').padEnd(2, '0'), 10);
    return secs * 100 + cents;
  }

  return null;
}

export function formatHundredthsToTime(hundredths: number): string {
  const totalSecs = Math.floor(hundredths / 100);
  const cents = hundredths % 100;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const centsStr = cents.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  if (mins > 0) {
    return `${mins}:${secsStr}.${centsStr}`;
  }
  return `${secs}.${centsStr}`;
}

export function formatDelta(deltaHundredths: number): string {
  const abs = Math.abs(deltaHundredths);
  const secs = Math.floor(abs / 100);
  const cents = abs % 100;
  const sign = deltaHundredths < 0 ? '-' : '+';
  return `${sign}${secs}.${cents.toString().padStart(2, '0')}s`;
}

export type DeltaStatus = 'qualified' | 'close' | 'near' | 'far';

export function getDeltaStatus(deltaHundredths: number): DeltaStatus {
  if (deltaHundredths <= 0) return 'qualified';
  if (deltaHundredths <= 100) return 'close';
  if (deltaHundredths <= 300) return 'near';
  return 'far';
}

export function ageToAgeGroup(age: number): string {
  if (age <= 8) return '8U';
  if (age <= 10) return '9-10';
  if (age <= 12) return '11-12';
  if (age <= 14) return '13-14';
  if (age <= 16) return '15-16';
  return '17-18';
}

export function birthYearToAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return ageToAgeGroup(age);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
