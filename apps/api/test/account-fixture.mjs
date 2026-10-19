// Trusted account fixtures for unrelated domain tests; never an HTTP registration bypass.
import * as argon2 from 'argon2';
import { PrismaService } from '../dist/database/prisma.service.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { PUBLIC_USER_SELECT } from '../dist/users/public-user.js';
export async function createAccountFixture(app, { email, name, password }) {
  if (process.env.NODE_ENV !== 'test')
    throw Error('Account fixtures require test mode');
  const user = await app.get(PrismaService).user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password: await argon2.hash(password, { type: argon2.argon2id }),
      emailVerifiedAt: new Date(),
      role: 'AUTHOR',
      // Domain suites start with an completed account; setup-specific suites exercise the gate.
      onboarding: {
        create: {
          setupRequired: true,
          setupStatus: 'completed',
          purpose: 'both',
          setupCompletedAt: new Date(),
        },
      },
      author: { create: { displayName: name.trim() } },
    },
    select: PUBLIC_USER_SELECT,
  });
  return app.get(AuthService).createToken(user);
}
