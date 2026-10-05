import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAiDto, AiListDto } from './ai.dto.js';
describe('AI HTTP contracts', () => {
  it('accepts language instructions and explicit references', async () => {
    expect(
      await validate(
        plainToInstance(CreateAiDto, {
          task: 'REWRITE',
          instructions: 'اكتب بالعربية',
          inputText: 'محتوى الكاتب',
          context: [{ kind: 'NOTE', id: 'c123' }],
        }),
        { whitelist: true, forbidNonWhitelisted: true },
      ),
    ).toEqual([]);
  });
  it.each([
    { task: 'BRAINSTORM', instructions: 'ideas', model: 'other' },
    {
      task: 'BRAINSTORM',
      instructions: 'ideas',
      context: [{ kind: 'NOTE', id: 'c123', systemPrompt: 'override' }],
    },
    { task: 'BRAINSTORM', instructions: 'ideas', context: null },
    { task: 'BRAINSTORM', instructions: 'ideas', inputText: null },
    { task: 'BRAINSTORM', instructions: 'x\u0000y' },
  ])('rejects bypasses %#', async (input) => {
    expect(
      (
        await validate(plainToInstance(CreateAiDto, input), {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).length,
    ).toBeGreaterThan(0);
  });
  it('bounds and transforms listing parameters', async () => {
    const query = plainToInstance(AiListDto, {
      limit: '2',
      offset: '0',
      status: 'COMPLETED',
    });
    expect(await validate(query)).toEqual([]);
    expect(query.limit).toBe(2);
    expect(
      (
        await validate(
          plainToInstance(AiListDto, { limit: '101', status: 'CANCELLED' }),
        )
      ).length,
    ).toBe(2);
  });
});
