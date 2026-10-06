import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { errorBody } from '../contracts/errors.js';

/** Fixed-window, bounded per-process defense. Deliberately ignores spoofable forwarding headers. */
export class RequestBudget {
  private readonly entries = new Map<
    string,
    { count: number; expires: number }
  >();
  private cleanupAt = 0;
  constructor(
    private readonly capacity = 10000,
    private readonly now = Date.now,
  ) {}
  consume(key: string, limit: number): number {
    const now = this.now();
    if (now >= this.cleanupAt) {
      for (const [id, entry] of this.entries)
        if (entry.expires <= now) this.entries.delete(id);
      this.cleanupAt = now + 60000;
    }
    let entry = this.entries.get(key);
    if (entry && entry.expires <= now) {
      this.entries.delete(key);
      entry = undefined;
    }
    if (!entry) {
      if (this.entries.size >= this.capacity) return 60;
      entry = { count: 0, expires: now + 60000 };
      this.entries.set(key, entry);
    }
    if (entry.count >= limit)
      return Math.max(1, Math.ceil((entry.expires - now) / 1000));
    entry.count++;
    return 0;
  }
}
export function httpSecurity(
  enabled: boolean,
  log = new Logger('HttpSecurity'),
) {
  const budget = new RequestBudget();
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const started = Date.now();
    res.once('finish', () => {
      if (res.statusCode >= 500)
        log.error({
          event: 'HTTP_FAILURE',
          requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - started,
        });
    });
    const path = req.path.toLowerCase().replace(/\/+$/, '');
    if (!enabled || !path.startsWith('/api/v1/') || path === '/api/v1/health')
      return next();
    // Express uses socket address by default; forwarding headers count only through validated trusted proxies.
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    let retry = budget.consume(`all:${ip}`, 300);
    const category =
      req.method === 'POST' &&
      ['/api/v1/auth/login', '/api/v1/auth/google'].includes(path)
        ? (['login', 20] as const)
        : req.method === 'POST' && path === '/api/v1/auth/register'
          ? (['register', 10] as const)
          : req.method === 'POST' &&
              /^\/api\/v1\/projects\/[^/]+\/media$/.test(path)
            ? (['upload', 20] as const)
            : path.endsWith('/search')
              ? (['search', 60] as const)
              : undefined;
    if (!retry && category)
      retry = budget.consume(`${category[0]}:${ip}`, category[1]);
    if (retry) {
      res.setHeader('Retry-After', retry);
      res.status(429).json(errorBody(429, 'Request limit reached'));
      return;
    }
    next();
  };
}
