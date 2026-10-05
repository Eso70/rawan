import { DocumentDto } from '../contracts/document-dto.js';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  NotContains,
  ValidateIf,
} from 'class-validator';
import type { SortOrder } from '@rawan/types';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;
export const MAX_OFFSET = 1000000;
export const optionalQuery = () =>
  ValidateIf((_o, value: unknown) => value !== undefined);
export const queryId = () =>
  applyDecorators(
    optionalQuery(),
    IsString(),
    Length(1, 128),
    Matches(/^[a-zA-Z0-9_-]+$/),
  );
export const searchText = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    Length(2, 200),
    NotContains('\u0000'),
  );
const integer = (min: number, max: number) =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
    ),
    optionalQuery(),
    IsInt(),
    Min(min),
    Max(max),
  );
@DocumentDto()
export class PaginationQueryDto {
  @integer(1, MAX_LIMIT) limit?: number;
  @integer(0, MAX_OFFSET) offset?: number;
}
@DocumentDto()
export class TextQueryDto extends PaginationQueryDto {
  @optionalQuery() @searchText() q?: string;
  @optionalQuery() @IsIn(['asc', 'desc']) order?: SortOrder;
}
@DocumentDto()
export class ProjectQueryDto extends TextQueryDto {
  @optionalQuery() @IsIn(['title', 'createdAt', 'updatedAt']) sort?:
    'title' | 'createdAt' | 'updatedAt';
}
@DocumentDto()
export class WorldQueryDto extends TextQueryDto {
  @optionalQuery() @IsIn(['name', 'createdAt', 'updatedAt']) sort?:
    'name' | 'createdAt' | 'updatedAt';
  @queryId() tagId?: string;
}
@DocumentDto()
export class SceneQueryDto extends TextQueryDto {
  @optionalQuery()
  @IsIn(['title', 'position', 'createdAt', 'updatedAt'])
  sort?: 'title' | 'position' | 'createdAt' | 'updatedAt';
  @queryId() tagId?: string;
}
