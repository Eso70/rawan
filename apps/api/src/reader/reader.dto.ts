import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DocumentDto } from '../contracts/document-dto.js';
import {
  PaginationQueryDto,
  optionalQuery,
  searchText,
} from '../query/query.dto.js';

@DocumentDto()
export class LibraryDto {
  @IsIn(['WANT_TO_READ', 'READING', 'FINISHED', 'PAUSED', 'DID_NOT_FINISH'])
  status!:
    'WANT_TO_READ' | 'READING' | 'FINISHED' | 'PAUSED' | 'DID_NOT_FINISH';
  @IsBoolean() favorite!: boolean;
}
@DocumentDto()
export class SaveLibraryDto extends LibraryDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) releaseId!: string;
}
@DocumentDto()
export class LibraryQueryDto extends PaginationQueryDto {
  @optionalQuery()
  @IsIn(['WANT_TO_READ', 'READING', 'FINISHED', 'PAUSED', 'DID_NOT_FINISH'])
  status?: LibraryDto['status'];
  @optionalQuery() @IsIn(['true', 'false']) favorite?: string;
  @optionalQuery() @searchText() q?: string;
}
@DocumentDto()
export class CollectionDto {
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(0, 4000) description!: string;
  @IsString() @Length(1, 200) curatorLabel!: string;
  @IsBoolean() public!: boolean;
  @IsBoolean() editorial!: boolean;
}
@DocumentDto()
export class CollectionMemberDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) entryId!: string;
  @IsInt() @Min(0) @Max(10000) position!: number;
}
@DocumentDto()
export class LocatorDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) releaseId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) sectionId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) blockId!: string;
  @IsInt() @Min(0) @Max(50000) offset!: number;
}
@DocumentDto()
export class ProgressDto extends LocatorDto {
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
}
@DocumentDto()
export class BookmarkDto extends LocatorDto {
  @IsString() @Length(0, 300) label!: string;
}
@DocumentDto()
export class AnnotationDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) releaseId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) sectionId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) blockId!: string;
  @IsInt() @Min(0) @Max(50000) startOffset!: number;
  @IsInt() @Min(1) @Max(50000) endOffset!: number;
  @IsString() @Length(0, 4000) note!: string;
  @IsIn(['yellow', 'green', 'blue', 'pink', 'purple']) color!: string;
}
@DocumentDto()
export class ReaderSearchDto extends PaginationQueryDto {
  @searchText() q!: string;
}
export class LibraryResponse extends LibraryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true, type: 'string' }) workId!: string | null;
  @ApiProperty() title!: string;
  @ApiProperty() byline!: string;
  @ApiProperty({ nullable: true, type: 'string' }) availableReleaseId!:
    string | null;
  @ApiProperty({ format: 'date-time' }) addedAt!: string;
}
export class CollectionResponse extends CollectionDto {
  @ApiProperty() id!: string;
}
export class CollectionMemberResponse extends CollectionMemberDto {
  @ApiProperty() id!: string;
  @ApiProperty() collectionId!: string;
}
export class PublicCollectionMemberResponse {
  @ApiProperty() workId!: string;
  @ApiProperty() releaseId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() position!: number;
}
export class ProgressResponse {
  @ApiProperty() locatorKind!: string;
  @ApiProperty({ type: 'number', nullable: true }) graphicOffset!:
    number | null;
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true, type: 'string' }) workId!: string | null;
  @ApiProperty({ nullable: true, type: 'string' }) releaseId!: string | null;
  @ApiProperty() sectionId!: string;
  @ApiProperty() blockId!: string;
  @ApiProperty() offset!: number;
  @ApiProperty() progression!: number;
  @ApiProperty() furthest!: number;
  @ApiProperty() revision!: number;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty() available!: boolean;
}
export class ResumeResponse {
  @ApiProperty() releaseId!: string;
  @ApiProperty() locatorKind!: string;
  @ApiProperty() sectionId!: string;
  @ApiProperty() blockId!: string;
  @ApiProperty() offset!: number;
  @ApiProperty({ type: 'number', nullable: true }) graphicOffset!:
    number | null;
  @ApiProperty() mapped!: boolean;
  @ApiProperty() revision!: number;
}
@DocumentDto()
export class GraphicLocatorDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) releaseId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) pageId!: string;
  @IsInt() @Min(0) @Max(1000) panelPosition!: number;
}
@DocumentDto()
export class GraphicProgressDto extends GraphicLocatorDto {
  @IsNumber() @Min(0) @Max(1) pageProgress!: number;
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
}
@DocumentDto()
export class GraphicBookmarkDto extends GraphicLocatorDto {
  @IsString() @Length(0, 300) label!: string;
}
export class BookmarkResponse extends BookmarkDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class AnnotationResponse extends AnnotationDto {
  @ApiProperty() id!: string;
  @ApiProperty() quote!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class ReaderSearchResponse {
  @ApiProperty() sectionId!: string;
  @ApiProperty() blockId!: string;
  @ApiProperty() snippet!: string;
}
