import { DocumentDto } from '../contracts/document-dto.js';
import { TextQueryDto, queryId } from '../query/query.dto.js';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { WorldEntityKind } from '@rawan/types';

export const CHRONOLOGY_PATTERN = /^-?(?:0|[1-9][0-9]{0,23})(?:\.[0-9]{1,6})?$/;
const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
const requiredText = () => applyDecorators(trim(), IsString(), Length(1, 200));
const optionalRequiredText = () =>
  applyDecorators(
    ValidateIf((_o, v: unknown) => v !== undefined),
    requiredText(),
  );
const notes = (max = 10000) =>
  applyDecorators(IsOptional(), IsString(), MaxLength(max));
const chronology = (optional = false, nullable = false) =>
  applyDecorators(
    ...(optional
      ? [
          ValidateIf(
            (_o, v: unknown) => v !== undefined && (!nullable || v !== null),
          ),
        ]
      : []),
    IsString(),
    Matches(CHRONOLOGY_PATTERN, {
      message:
        'chronology must be a decimal string with up to 24 integer digits and 6 fractional digits',
    }),
  );
const position = () =>
  applyDecorators(
    ValidateIf((_o, v: unknown) => v !== undefined),
    IsInt(),
    Min(0),
    Max(2147483647),
  );
const identifier = (nullable = false) =>
  applyDecorators(
    ValidateIf(
      (_o, v: unknown) => v !== undefined && (!nullable || v !== null),
    ),
    IsString(),
    Length(1, 128),
    Matches(/^[a-zA-Z0-9_-]+$/),
  );
@DocumentDto()
export class CreateTimelineDto {
  @requiredText() name!: string;
  @notes() description?: string | null;
}
@DocumentDto()
export class UpdateTimelineDto {
  @optionalRequiredText() name?: string;
  @notes() description?: string | null;
}
@DocumentDto()
export class CreateEraDto extends CreateTimelineDto {
  @position() position?: number;
  @chronology(true, true) start?: string | null;
  @chronology(true, true) end?: string | null;
}
@DocumentDto()
export class UpdateEraDto extends UpdateTimelineDto {
  @position() position?: number;
  @chronology(true, true) start?: string | null;
  @chronology(true, true) end?: string | null;
}
@DocumentDto()
export class CreateEventDto {
  @requiredText() title!: string;
  @notes(1000) summary?: string | null;
  @notes() description?: string | null;
  @chronology() start!: string;
  @chronology(true, true) end?: string | null;
  @notes(200) dateLabel?: string | null;
  @position() position?: number;
  @identifier(true) eraId?: string | null;
}
@DocumentDto()
export class UpdateEventDto {
  @optionalRequiredText() title?: string;
  @notes(1000) summary?: string | null;
  @notes() description?: string | null;
  @chronology(true) start?: string;
  @chronology(true, true) end?: string | null;
  @notes(200) dateLabel?: string | null;
  @position() position?: number;
  @identifier(true) eraId?: string | null;
}
@DocumentDto()
export class AttachEventEntityDto {
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT']) kind!: WorldEntityKind;
  @IsString() @Length(1, 128) @Matches(/^[a-zA-Z0-9_-]+$/) entityId!: string;
  @IsOptional() @trim() @IsString() @Length(1, 100) role?: string | null;
}
@DocumentDto()
export class EventQueryDto extends TextQueryDto {
  @queryId() tagId?: string;
  @ValidateIf((_o, v: unknown) => v !== undefined)
  @IsIn(['title', 'start', 'position', 'createdAt', 'updatedAt'])
  sort?: 'title' | 'start' | 'position' | 'createdAt' | 'updatedAt';
  @identifier() eraId?: string;
  @ValidateIf((_o, v: unknown) => v !== undefined)
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
  entityKind?: WorldEntityKind;
  @identifier() entityId?: string;
  @chronology(true) from?: string;
  @chronology(true) to?: string;
}
