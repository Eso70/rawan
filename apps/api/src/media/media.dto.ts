import { DocumentDto } from '../contracts/document-dto.js';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';
import type { MediaResourceKind } from '@rawan/types';
import {
  PaginationQueryDto,
  TextQueryDto,
  optionalQuery,
} from '../query/query.dto.js';
export const MEDIA_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;
export const MEDIA_KINDS = [
  'PROJECT',
  'NOTE',
  'CHARACTER',
  'PLACE',
  'FACTION',
  'ARTIFACT',
] as const;
@DocumentDto()
export class MediaQueryDto extends TextQueryDto {
  @optionalQuery() @IsIn(['createdAt', 'originalFilename', 'sizeBytes']) sort?:
    'createdAt' | 'originalFilename' | 'sizeBytes';
  @optionalQuery() @IsIn(MEDIA_MIMES) mimeType?: string;
}
@DocumentDto()
export class AttachMediaDto {
  @IsIn(MEDIA_KINDS) resourceKind!: MediaResourceKind;
  @IsString() @Length(1, 128) @Matches(/^[a-zA-Z0-9_-]+$/) resourceId!: string;
  @optionalQuery()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{0,49}$/)
  role?: string;
}
@DocumentDto()
export class MediaResourceQueryDto extends PaginationQueryDto {
  @IsIn(MEDIA_KINDS) resourceKind!: MediaResourceKind;
  @IsString() @Length(1, 128) @Matches(/^[a-zA-Z0-9_-]+$/) resourceId!: string;
}
