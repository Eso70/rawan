import { requireBoundedDetails } from './detail-bounds.js';
import { pointInclude } from '../plot/plot-response.js';
import { eventInclude } from '../timeline/timeline-response.js';
describe('complete bounded association details', () => {
  it('permits complete arrays but rejects overflow rather than silently truncating', () => {
    expect(() =>
      requireBoundedDetails(
        [],
        Array.from({ length: 1000 }, () => null),
      ),
    ).not.toThrow();
    expect(() =>
      requireBoundedDetails(
        [],
        Array.from({ length: 1001 }, () => null),
      ),
    ).toThrow('Detail association limit reached');
  });
  it('queries at most one overflow row for every embedded association list', () => {
    for (const relation of [
      pointInclude.scenes,
      pointInclude.events,
      pointInclude.entities,
      eventInclude.entities,
    ])
      expect(relation.take).toBe(1001);
  });
});
