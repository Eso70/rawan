import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProjectQueryDto } from './query.dto.js';
import {
  contains,
  literalPattern,
  page,
  pagination,
  requireTag,
  sorting,
} from './query.js';
import type { Prisma } from '@rawan/database';
describe('shared query contract', () => {
  it.each([
    {},
    {
      limit: '100',
      offset: '1000000',
      q: '  dragon  ',
      sort: 'title',
      order: 'desc',
    },
  ])('validates defaults and bounds %j', (input) => {
    expect(
      validateSync(plainToInstance(ProjectQueryDto, input), {
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ).toEqual([]);
  });
  it.each([
    { limit: '0' },
    { limit: '-1' },
    { limit: '101' },
    { limit: 'foo' },
    { limit: ['2', '3'] },
    { offset: '-1' },
    { offset: '1.5' },
    { offset: '1000001' },
    { q: ' ' },
    { q: 'a' },
    { q: 'x'.repeat(201) },
    { q: '\u0000x' },
    { q: ['ab', 'cd'] },
    { sort: 'password' },
    { sort: 'constructor' },
    { order: 'ASC' },
    { order: null },
    { ownerId: 'bob' },
  ])('rejects malformed query %j', (input) => {
    expect(
      validateSync(plainToInstance(ProjectQueryDto, input), {
        whitelist: true,
        forbidNonWhitelisted: true,
      }).length,
    ).toBeGreaterThan(0);
  });
  it('produces bounded pages without totals or counts', () => {
    expect(pagination({})).toEqual({ take: 51, skip: 0 });
    expect(page([1, 2, 3], { limit: 2, offset: 2 }, String)).toEqual({
      items: ['1', '2'],
      nextOffset: 4,
    });
    expect(page([], { offset: 100 }, String)).toEqual({
      items: [],
      nextOffset: null,
    });
  });
  it('treats LIKE wildcard characters literally', () => {
    expect(literalPattern('50%_\\')).toBe('50\\%\\_\\\\');
    expect(contains('50%')).toEqual({ contains: '50\\%', mode: 'insensitive' });
  });
  it('allows explicit sorts and stable secondary identity', () => {
    const allowed = { title: (order: 'asc' | 'desc') => ({ title: order }) };
    const fallback = [{ title: 'asc' as const }, { id: 'asc' as const }];
    expect(
      sorting<{ title?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>(
        { sort: 'title', order: 'desc' },
        allowed,
        fallback,
        'title',
        'asc',
      ),
    ).toEqual([{ title: 'desc' }, { id: 'asc' }]);
    expect(() =>
      sorting(
        { sort: '__proto__' },
        allowed,
        [{ title: 'asc' }],
        'title',
        'asc',
      ),
    ).toThrow('Unsupported sort');
  });
  it('checks the tag project and current owner independently of the resource query', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { tag: { findFirst } } as unknown as Prisma.TransactionClient;
    await expect(
      requireTag(db, 'alice', 'project-a', 'tag-from-b'),
    ).rejects.toThrow('Tag not found in this project');
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'tag-from-b',
        projectId: 'project-a',
        project: { author: { userId: 'alice' } },
      },
      select: { id: true },
    });
    findFirst.mockClear();
    await requireTag(db, 'alice', 'project-a');
    expect(findFirst).not.toHaveBeenCalled();
  });
});
