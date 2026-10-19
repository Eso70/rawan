import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
} from '@rawan/types/onboarding';
import { UpdateSetupDto } from './setup.dto.js';

const groups = {
  creativeInterests: creativeGroups,
  readingFormats: readingFormatGroups,
  readingGenres: readingGenreGroups,
  readingTopics: readingTopicGroups,
};
const allChoices = Object.fromEntries(
  Object.entries(groups).map(([field, catalogue]) => [
    field,
    catalogue.flatMap((group) => group.options.map((option) => option.value)),
  ]),
);

describe('Expanded setup interests', () => {
  it('accepts the complete catalogue, including the newly added choices', async () => {
    expect(
      await validate(
        plainToInstance(UpdateSetupDto, {
          expectedRevision: 0,
          purpose: 'both',
          ...allChoices,
        }),
      ),
    ).toEqual([]);
  });
  it.each(Object.keys(groups))(
    'still rejects unknown and duplicate values in %s',
    async (field) => {
      const values = allChoices[field] as string[];
      for (const invalid of [['not-a-real-interest'], [values[0], values[0]]]) {
        const errors = await validate(
          plainToInstance(UpdateSetupDto, {
            expectedRevision: 0,
            [field]: invalid,
          }),
        );
        expect(errors.some((error) => error.property === field)).toBe(true);
      }
    },
  );
});
