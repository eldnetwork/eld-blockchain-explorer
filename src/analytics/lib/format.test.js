import { describe, expect, it } from 'vitest';
import { formatBytes, formatShortTime, formatTime, sum } from './format';

describe('formatBytes', () => {
  it('formats zero and invalid values', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
  });

  it('picks a sensible unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});

describe('formatTime', () => {
  it('returns the input when the date is invalid', () => {
    expect(formatTime('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid ISO timestamp', () => {
    const formatted = formatTime('2026-10-12T08:30:00.000Z');
    expect(formatted).not.toBe('2026-10-12T08:30:00.000Z');
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('formatShortTime', () => {
  it('returns the input when the date is invalid', () => {
    expect(formatShortTime('nope')).toBe('nope');
  });
});

describe('sum', () => {
  it('adds numbers', () => {
    expect(sum([])).toBe(0);
    expect(sum([1, 2, 3])).toBe(6);
  });
});
