import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DocumentDto } from '../contracts/document-dto.js';
import {
  PaginationQueryDto,
  optionalQuery,
  searchText,
} from '../query/query.dto.js';

@DocumentDto()
export class MetadataDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  coverAssetId?: string;
  @IsOptional() @IsString() @Length(0, 300) subtitle?: string;
  @IsString() @Length(0, 10000) synopsis!: string;
  @IsString()
  @Matches(/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/)
  @Length(2, 35)
  language!: string;
  @IsIn(['PROSE', 'GRAPHIC']) medium!: 'PROSE' | 'GRAPHIC';
  @IsOptional() @IsString() @Length(1, 80) form?: string;
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  genres!: string[];
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  topics!: string[];
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  warnings!: string[];
}

@DocumentDto()
export class CreatorDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  avatarAssetId?: string;
  @IsString() @Matches(/^[a-z][a-z0-9_-]{2,49}$/) handle!: string;
  @IsString() @Length(1, 200) displayName!: string;
  @IsString() @Length(0, 10000) biography!: string;
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsUrl(
    { protocols: ['https'], require_protocol: true, disallow_auth: true },
    { each: true },
  )
  links!: string[];
  @IsBoolean() public!: boolean;
}

@DocumentDto()
export class CreditDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  creatorId?: string;
  @IsString() @Length(1, 200) displayName!: string;
  @IsIn(['AUTHOR', 'ILLUSTRATOR', 'TRANSLATOR', 'EDITOR', 'CONTRIBUTOR'])
  role!: 'AUTHOR' | 'ILLUSTRATOR' | 'TRANSLATOR' | 'EDITOR' | 'CONTRIBUTOR';
  @IsInt() @Min(0) @Max(1000) position!: number;
}

@DocumentDto()
export class EditionDto {
  @IsOptional()
  @IsIn(['WEB', 'EPUB', 'PDF', 'PRINT', 'GRAPHIC'])
  format?: string;
  @IsString() @Length(1, 200) label!: string;
  @IsString()
  @Matches(/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/)
  @Length(2, 35)
  language!: string;
  @IsOptional() @IsString() @Length(1, 200) publisher?: string;
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/)
  publicationDate?: string;
  @IsOptional() @IsString() @Matches(/^97[89]\d{10}$/) isbn13?: string;
  @IsOptional()
  @IsString()
  @Length(7, 200)
  @Matches(/^10\.\d{4,9}\/\S+$/)
  doi?: string;
}

@DocumentDto()
export class SeriesDto {
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(0, 10000) description!: string;
  @IsBoolean() anthology!: boolean;
  @IsBoolean() public!: boolean;
}

@DocumentDto()
export class SeriesMemberDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) workId!: string;
  @IsInt() @Min(0) @Max(10000) position!: number;
  @IsOptional() @IsString() @Length(1, 100) label?: string;
}

@DocumentDto()
export class RelatedDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) targetWorkId!: string;
  @IsIn(['SEQUEL', 'PREQUEL', 'TRANSLATION', 'ADAPTATION', 'COMPANION'])
  kind!: string;
}

@DocumentDto()
export class SupplementSelectionDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) projectId!: string;
  @IsIn([
    'CHARACTER',
    'PLACE',
    'FACTION',
    'ARTIFACT',
    'TIMELINE_EVENT',
    'RELATIONSHIP',
    'MAP',
  ])
  kind!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) id!: string;
  @IsBoolean() includeDescription!: boolean;
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) assetId?: string;
}
@DocumentDto({ supplements: () => [SupplementSelectionDto] })
export class CreateReleaseDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  relatedIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  assetIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  sourceIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  documentIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SupplementSelectionDto)
  supplements?: SupplementSelectionDto[];
  @IsOptional() @IsBoolean() includeBibliography?: boolean;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  editionId?: string;
}
@DocumentDto()
export class CatalogQueryDto extends PaginationQueryDto {
  @optionalQuery() @searchText() q?: string;
  @optionalQuery() @IsIn(['PROSE', 'GRAPHIC']) medium?: 'PROSE' | 'GRAPHIC';
  @optionalQuery() @IsString() @Length(1, 80) genre?: string;
  @optionalQuery() @IsString() @Length(1, 80) topic?: string;
  @optionalQuery()
  @IsString()
  @Length(2, 35)
  @Matches(/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/)
  language?: string;
  @optionalQuery() @IsIn(['title', 'publishedAt']) sort?: string;
  @optionalQuery() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
}
export class PublicSeriesMemberResponse {
  @ApiProperty() workId!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: 'string', nullable: true }) label!: string | null;
}
export class PublicSeriesMembersResponse {
  @ApiProperty({ type: () => [PublicSeriesMemberResponse] })
  items!: PublicSeriesMemberResponse[];
  @ApiProperty({ type: 'integer', nullable: true }) nextOffset!: number | null;
}

export class SupplementResponse {
  @ApiProperty() id!: string;
  @ApiProperty() releaseId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() title!: string;
  @ApiProperty() text!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  data!: object | null;
}

export class PublicRelatedResponse {
  @ApiProperty() targetWorkId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() releaseId!: string;
  @ApiProperty() title!: string;
}
export class ReleaseAssetResponse {
  @ApiProperty() assetId!: string;
}

export class MetadataResponse extends MetadataDto {
  @ApiProperty() workId!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class CreatorResponse extends CreatorDto {
  @ApiProperty() id!: string;
}
export class CreditResponse extends CreditDto {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
}
export class EditionResponse extends EditionDto {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
}
export class SeriesResponse extends SeriesDto {
  @ApiProperty() id!: string;
}
export class SeriesMemberResponse extends SeriesMemberDto {
  @ApiProperty() id!: string;
  @ApiProperty() seriesId!: string;
}
export class RelatedResponse extends RelatedDto {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
}
export class ReleaseResponse extends MetadataDto {
  @ApiProperty({ type: 'string', nullable: true }) graphicLayout!:
    string | null;
  @ApiProperty({ type: 'string', nullable: true }) readingDirection!:
    string | null;
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: number;
  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'WITHDRAWN'] }) status!: string;
  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  edition!: object | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  publishedAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  withdrawnAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class PublicCreditResponse {
  @ApiProperty() displayName!: string;
  @ApiProperty({
    enum: ['AUTHOR', 'ILLUSTRATOR', 'TRANSLATOR', 'EDITOR', 'CONTRIBUTOR'],
  })
  role!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: 'string', nullable: true }) creatorHandle!:
    string | null;
}
export class SectionResponse {
  @ApiProperty({ type: 'string', nullable: true }) groupTitle!: string | null;
  @ApiProperty() id!: string;
  @ApiProperty() releaseId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() position!: number;
}
export class BlockResponse {
  @ApiProperty() id!: string;
  @ApiProperty() sectionId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() text!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: 'string', nullable: true }) footnoteLabel!:
    string | null;
  @ApiProperty({ type: 'string', nullable: true }) referenceLabel!:
    string | null;
}

export class PublicSeriesResponse extends SeriesResponse {
  @ApiProperty({ type: () => PublicSeriesMembersResponse })
  members!: PublicSeriesMembersResponse;
}
export class PreviewSectionResponse extends SectionResponse {
  @ApiProperty({ type: () => [BlockResponse] }) blocks!: BlockResponse[];
}

export class PrivateReleaseResponse extends ReleaseResponse {
  @ApiProperty({ type: () => [PublicCreditResponse] })
  credits!: PublicCreditResponse[];
  @ApiProperty({ type: () => [ReleaseAssetResponse] })
  assets!: ReleaseAssetResponse[];
  @ApiProperty({ type: () => [SupplementResponse] })
  supplements!: SupplementResponse[];
  @ApiProperty() sectionCount!: number;
  @ApiProperty() graphicPageCount!: number;
}
