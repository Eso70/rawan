import { canonicalEndpoints, normalizeTypeKey } from './relationship-policy.js';
import type { WorldEntityReference } from '@rawan/types';
const a: WorldEntityReference = { kind: 'CHARACTER', id: 'a' };
const b: WorldEntityReference = { kind: 'PLACE', id: 'b' };
describe('relationship identity', () => {
  it('normalizes flexible type keys without normalizing display labels', () => {
    expect(normalizeTypeKey(' member-of ')).toBe('MEMBER_OF');
    expect(normalizeTypeKey('allied   with')).toBe('ALLIED_WITH');
  });
  it('canonicalizes symmetric pairs, preserving directional source and target', () => {
    expect(canonicalEndpoints(b, a, 'SYMMETRIC')).toEqual({
      source: a,
      target: b,
    });
    expect(canonicalEndpoints(a, b, 'SYMMETRIC')).toEqual({
      source: a,
      target: b,
    });
    expect(canonicalEndpoints(b, a, 'DIRECTIONAL')).toEqual({
      source: b,
      target: a,
    });
  });
  it('rejects self-links but distinguishes identical IDs in different entity tables', () => {
    expect(() => canonicalEndpoints(a, a, 'DIRECTIONAL')).toThrow();
    expect(
      canonicalEndpoints(a, { kind: 'PLACE', id: 'a' }, 'SYMMETRIC').target
        .kind,
    ).toBe('PLACE');
  });
});
