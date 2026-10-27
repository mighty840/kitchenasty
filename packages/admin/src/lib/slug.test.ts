import { describe, expect, it } from 'vitest';
import { slugify } from './slug.js';

describe('slugify', () => {
  it.each([
    ['G\u00f3rnicza', 'gornicza'],
    ['Go\u0301rnicza', 'gornicza'],
    ['\u0141\u00f3d\u017a', 'lodz'],
    ['Za\u017c\u00f3\u0142\u0107 g\u0119\u015bl\u0105 ja\u017a\u0144', 'zazolc-gesla-jazn'],
    ['Cr\u00e8me br\u00fbl\u00e9e', 'creme-brulee'],
    ['Downtown Kitchen', 'downtown-kitchen'],
    [' -- Kitchen & Bar 123! -- ', 'kitchen-bar-123'],
    ['already-a-slug', 'already-a-slug'],
    ['', ''],
    ['---!?', ''],
  ])('converts %j to %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
