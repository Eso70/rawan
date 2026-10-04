import { AppController } from './app.controller.js';

describe('health', () => {
  it('returns a small public liveness response', () => {
    expect(new AppController().getHealth()).toEqual({
      status: 'ok',
      service: 'rawan-api',
    });
  });
});
