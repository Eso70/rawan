import { SearchService } from './search.service.js';
import { searchSql } from './search.sql.js';
import type { PrismaService } from '../database/prisma.service.js';
describe('project search query security', () => {
  it('binds user, project and text instead of interpolating SQL', () => {
    const attack = "dragon' OR true --";
    const query = searchSql('alice', 'project-a', {
      q: attack,
      limit: 2,
      offset: 4,
    });
    expect(query.text).not.toContain(attack);
    expect(query.values).toContain(attack);
    expect(query.values).toContain('alice');
    expect(query.values).toContain('project-a');
    expect(query.text).toContain('a."userId"=');
    expect(query.text).not.toMatch(/password|email|"User"/);
    expect(query.values.slice(-2)).toEqual([3, 4]);
    expect(query.text).toContain('FOR 240');
  });
  it('restricts supported kinds before querying', () => {
    const query = searchSql('a', 'p', { q: 'dragon', kind: 'NOTE' });
    expect(query.text).toContain('"Note"');
    expect(query.text).not.toContain('"Scene"');
  });
  it('does not query inaccessible projects', async () => {
    const db = {
      project: { findFirst: vi.fn().mockResolvedValue(null) },
      $queryRaw: vi.fn(),
    };
    await expect(
      new SearchService(db as unknown as PrismaService).search('a', 'b', {
        q: 'secret',
      }),
    ).rejects.toThrow('Project not found');
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
  it('maps only public search fields and bounds the page', async () => {
    const row = {
      kind: 'NOTE',
      id: 'n',
      projectId: 'p',
      title: 'A',
      snippet: 'Text',
      updatedAt: new Date('2026-01-01'),
      password: 'secret',
    };
    const db = {
      project: { findFirst: vi.fn().mockResolvedValue({ id: 'p' }) },
      $queryRaw: vi.fn().mockResolvedValue([row, { ...row, id: 'n2' }]),
    };
    const result = await new SearchService(
      db as unknown as PrismaService,
    ).search('a', 'p', { q: 'text', limit: 1 });
    expect(result.nextOffset).toBe(1);
    expect(result.items).toEqual([
      {
        kind: 'NOTE',
        id: 'n',
        projectId: 'p',
        title: 'A',
        snippet: 'Text',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});
