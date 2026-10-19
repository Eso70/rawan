import {
  Injectable,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service.js';
import { hasSetupAccess } from '@rawan/types/onboarding';
import type { AuthenticatedUser } from '../auth.types.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) return false;
    // Identity and account setup must remain reachable before required setup is complete.
    if (Reflect.getMetadata('rawan:setup-access', context.getClass()))
      return true;
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    const setup = await this.prisma.userOnboarding.findUnique({
      where: { userId: user.userId },
      select: { setupRequired: true, setupStatus: true },
    });
    if (
      !hasSetupAccess({
        required: setup?.setupRequired ?? false,
        status: (setup?.setupStatus ?? 'not_started') as
          'not_started' | 'in_progress' | 'completed',
      })
    ) {
      throw new ForbiddenException(
        'Complete required account setup before accessing this experience.',
      );
    }
    return true;
  }
}
