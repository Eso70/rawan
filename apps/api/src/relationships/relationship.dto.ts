import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { RelationshipDirection, WorldEntityKind } from '@rawan/types';
import { normalizeTypeKey } from './relationship-policy.js';

export class EntityReferenceDto {
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
  kind!: WorldEntityKind;
  @IsString()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  id!: string;
}
export class CreateRelationshipDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  source!: EntityReferenceDto;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  target!: EntityReferenceDto;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeTypeKey(value) : value,
  )
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  typeKey!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  label!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['DIRECTIONAL', 'SYMMETRIC'])
  direction?: RelationshipDirection;
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;
}
export class UpdateRelationshipDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  source?: EntityReferenceDto;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  target?: EntityReferenceDto;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeTypeKey(value) : value,
  )
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  typeKey?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  label?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['DIRECTIONAL', 'SYMMETRIC'])
  direction?: RelationshipDirection;
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;
}
export class RelationshipQueryDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
  entityKind?: WorldEntityKind;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  entityId?: string;
}
