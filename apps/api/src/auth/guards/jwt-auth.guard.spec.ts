import { type ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { PrismaService } from '../../database/prisma.service.js';
const authenticate = vi.hoisted(() => vi.fn());
vi.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      canActivate(context: unknown) {
        return authenticate(context);
      }
    },
}));
describe('Setup access guard', () => {
  const controller = class ProductController {};
  const account = class AccountController {};
  Reflect.defineMetadata('rawan:setup-access', true, account);
  const context = (target = controller) =>
    ({
      getClass: () => target,
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 'signed-user' } }),
      }),
    }) as unknown as ExecutionContext;
  let lookup: ReturnType<typeof vi.fn>;
  let guard: JwtAuthGuard;
  beforeEach(() => {
    authenticate.mockReset().mockResolvedValue(true);
    lookup = vi.fn();
    guard = new JwtAuthGuard({
      userOnboarding: { findUnique: lookup },
    } as unknown as PrismaService);
  });
  it('keeps identity and setup reachable before completing required setup', async () => {
    await expect(guard.canActivate(context(account))).resolves.toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });
  it('does not query setup or grant access when authentication fails', async () => {
    authenticate.mockRejectedValue(Error('expired'));
    await expect(guard.canActivate(context())).rejects.toThrow('expired');
    expect(lookup).not.toHaveBeenCalled();
  });
  it.each([
    { setupRequired: true, setupStatus: 'not_started' },
    { setupRequired: true, setupStatus: 'in_progress' },
  ])('rejects incomplete required setup: %j', async (row) => {
    lookup.mockResolvedValue(row);
    await expect(guard.canActivate(context())).rejects.toMatchObject({
      status: 403,
    });
  });
  it.each([
    null,
    { setupRequired: false, setupStatus: 'not_started' },
    { setupRequired: false, setupStatus: 'in_progress' },
    { setupRequired: true, setupStatus: 'completed' },
  ])(
    'allows an existing or completed account without declaration: %j',
    async (row) => {
      lookup.mockResolvedValue(row);
      await expect(guard.canActivate(context())).resolves.toBe(true);
      expect(lookup).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'signed-user' } }),
      );
    },
  );
  it('does not grant access when the setup store fails', async () => {
    lookup.mockRejectedValue(Error('unavailable'));
    await expect(guard.canActivate(context())).rejects.toThrow('unavailable');
  });
});
