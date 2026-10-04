import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UsersService } from './users.service.js';

describe('safe UsersService queries', () => {
  const record = {
    id: 'user-id',
    name: 'Author',
    email: 'author@example.com',
    role: 'AUTHOR',
    password: 'must-never-escape',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const findFirst = vi.fn();
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([record]);
    findUnique.mockResolvedValue(record);
    findFirst.mockResolvedValue(record);
    service = new UsersService({
      user: { findMany, findUnique, findFirst },
    } as unknown as PrismaService);
  });

  it('selects and serializes safe fields on every lookup', async () => {
    const results = [
      await service.findAll(),
      await service.findById(record.id),
      await service.findByEmail(' Author@Example.com '),
    ];
    expect(JSON.stringify(results)).not.toContain('must-never-escape');
    expect(JSON.stringify(results)).not.toContain('password');
    for (const query of [findMany, findUnique, findFirst]) {
      expect(query.mock.calls[0][0].select).not.toHaveProperty('password');
    }
  });

  it('returns 404 for an unknown id', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
