import { studioBackground } from './studio-background.js';

describe('backend-owned Studio atmosphere', () => {
  it.each([
    ['2026-03-01T06:00:00Z', 'spring-dawn'],
    ['2026-05-31T12:00:00Z', 'spring-rain'],
    ['2026-04-01T20:00:00Z', 'blue-hour-valley'],
    ['2026-06-01T12:00:00Z', 'summer-noon'],
    ['2026-07-01T18:00:00Z', 'summer-golden-hour'],
    ['2026-08-31T23:00:00Z', 'summer-night'],
    ['2026-09-01T08:00:00Z', 'autumn-morning'],
    ['2026-11-30T19:00:00Z', 'autumn-evening'],
    ['2026-12-01T08:00:00Z', 'winter-dawn'],
    ['2026-01-31T22:00:00Z', 'winter-night'],
    ['2026-02-28T04:59:59Z', 'winter-night'],
    ['2026-02-28T05:00:00Z', 'winter-dawn'],
  ])('selects %s as %s without a user preference', (iso, expected) => {
    expect(studioBackground(new Date(iso))).toEqual({
      backgroundId: expected,
      refreshAfterSeconds: 300,
    });
  });

  it('uses the same UTC instant regardless of the caller date offset', () => {
    expect(studioBackground(new Date('2026-10-19T09:00:00+03:00'))).toEqual(
      studioBackground(new Date('2026-10-19T06:00:00Z')),
    );
  });
});
