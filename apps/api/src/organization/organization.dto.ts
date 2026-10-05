import { DocumentDto } from '../contracts/document-dto.js';
import { PaginationQueryDto, TextQueryDto } from '../query/query.dto.js';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
  NotContains,
  ValidateIf,
} from 'class-validator';
import type { TagResourceKind } from '@rawan/types';
export const TAG_RESOURCE_KINDS = [
  'NOTE',
  'CHARACTER',
  'PLACE',
  'FACTION',
  'ARTIFACT',
  'SCENE',
  'TIMELINE_EVENT',
  'PLOT_POINT',
] as const;
const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
const text = () =>
  applyDecorators(
    IsString(),
    NotContains('\u0000', { message: 'must not contain null characters' }),
  );
const title = () => applyDecorators(trim(), text(), Length(1, 200));
const id = () =>
  applyDecorators(IsString(), Length(1, 128), Matches(/^[a-zA-Z0-9_-]+$/));
const optional = () => ValidateIf((_o, value: unknown) => value !== undefined);
const tagName = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : value,
    ),
    text(),
    Length(1, 100),
  );
@DocumentDto()
export class CreateNoteDto {
  @title() title!: string;
  @optional() @text() @MaxLength(50000) content?: string;
}
@DocumentDto()
export class UpdateNoteDto {
  @optional() @title() title?: string;
  @optional() @text() @MaxLength(50000) content?: string;
}
@DocumentDto()
export class CreateTagDto {
  @tagName() name!: string;
}
@DocumentDto()
export class UpdateTagDto {
  @optional() @tagName() name?: string;
}
@DocumentDto()
export class OrganizationPageDto extends PaginationQueryDto {}
@DocumentDto()
export class TagQueryDto extends TextQueryDto {
  @optional() @IsIn(['name', 'createdAt', 'updatedAt']) sort?:
    'name' | 'createdAt' | 'updatedAt';
}
@DocumentDto()
export class NoteQueryDto extends TextQueryDto {
  @optional() @IsIn(['title', 'createdAt', 'updatedAt']) sort?:
    'title' | 'createdAt' | 'updatedAt';
  @optional() @id() tagId?: string;
}
@DocumentDto()
export class AssignTagDto {
  @IsIn(TAG_RESOURCE_KINDS) resourceKind!: TagResourceKind;
  @id() resourceId!: string;
}
@DocumentDto()
export class TagAssignmentQueryDto extends OrganizationPageDto {
  @optional() @IsIn(TAG_RESOURCE_KINDS) resourceKind?: TagResourceKind;
}
@DocumentDto()
export class ResourceTagsQueryDto extends OrganizationPageDto {
  @IsIn(TAG_RESOURCE_KINDS) resourceKind!: TagResourceKind;
  @id() resourceId!: string;
}
