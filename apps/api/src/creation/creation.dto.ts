import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
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

@DocumentDto()
export class TitleDto {
  @IsString() @Length(1, 200) title!: string;
}
@DocumentDto()
export class DocumentBlockDto {
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) id?: string;
  @IsIn([
    'PARAGRAPH',
    'HEADING',
    'QUOTE',
    'LIST_ITEM',
    'CODE',
    'POEM',
    'FOOTNOTE',
    'REFERENCE',
  ])
  kind!: string;
  @IsString() @Length(0, 50000) text!: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,80}$/)
  footnoteLabel?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,80}$/)
  referenceLabel?: string;
}
@DocumentDto({ blocks: () => [DocumentBlockDto] })
export class DocumentSectionDto extends TitleDto {
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) id?: string;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DocumentBlockDto)
  blocks!: DocumentBlockDto[];
}
@DocumentDto({ sections: () => [DocumentSectionDto] })
export class ReplaceDocumentDto extends TitleDto {
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DocumentSectionDto)
  sections!: DocumentSectionDto[];
}
@DocumentDto()
export class ResearchDto extends TitleDto {
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) mediaId?: string;
  @IsIn(['BOOK', 'ARTICLE', 'WEB', 'INTERVIEW', 'DOCUMENT', 'OTHER'])
  kind!: string;
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  authors!: string[];
  @IsOptional()
  @IsUrl({
    protocols: ['https', 'http'],
    require_protocol: true,
    disallow_auth: true,
  })
  @Length(1, 2000)
  url?: string;
  @IsOptional() @IsString() @Length(1, 200) publisher?: string;
  @IsOptional() @IsString() @Length(1, 100) publicationDate?: string;
  @IsOptional() @IsString() @Length(1, 200) identifier?: string;
  @IsString() @Length(0, 4000) provenance!: string;
}
@DocumentDto()
export class CitationDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) documentBlockId!: string;
  @IsString() @Length(0, 300) locator!: string;
  @IsString() @Length(0, 4000) quotation!: string;
}
@DocumentDto()
export class PreferenceValuesDto {
  @IsOptional() @IsString() @Matches(/^#[a-fA-F0-9]{6}$/) accent?: string;
  @IsOptional() @IsIn(['light', 'dark', 'system', 'sepia']) theme?: string;
  @IsOptional() @IsIn(['system', 'reduced']) motion?: string;
  @IsOptional() @IsIn(['serif', 'sans', 'mono']) fontFamily?: string;
  @IsOptional() @IsNumber() @Min(12) @Max(40) fontSize?: number;
  @IsOptional() @IsNumber() @Min(1.2) @Max(2.5) lineHeight?: number;
  @IsOptional() @IsInt() @Min(320) @Max(1200) contentWidth?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(3) paragraphSpacing?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) margin?: number;
  @IsOptional() @IsIn(['start', 'justify']) alignment?: string;
  @IsOptional() @IsBoolean() focusMode?: boolean;
  @IsOptional()
  @IsIn(['page', 'spread', 'vertical', 'guided'])
  comicMode?: string;
}
@DocumentDto()
export class PreferenceDto {
  @IsIn(['GLOBAL', 'CREATOR', 'READER', 'PROJECT', 'WORK']) scope!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) contextId!: string;
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PreferenceValuesDto)
  values!: PreferenceValuesDto;
}
@DocumentDto()
export class SavedQueryDto {
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) bookId?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  chapterId?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  timelineId?: string;
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) plotId?: string;
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) eraId?: string;
  @IsOptional() @IsString() @Length(2, 200) q?: string;
  @IsOptional()
  @IsIn(['title', 'name', 'position', 'start', 'createdAt', 'updatedAt'])
  sort?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: string;
  @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) tagId?: string;
}
@DocumentDto()
export class SavedViewDto extends TitleDto {
  @IsIn([
    'BOOK',
    'CHARACTER',
    'PLACE',
    'FACTION',
    'ARTIFACT',
    'NOTE',
    'SCENE',
    'TIMELINE_EVENT',
    'PLOT_POINT',
  ])
  resource!: string;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => SavedQueryDto)
  query!: SavedQueryDto;
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsIn(
    [
      'writing',
      'characters',
      'places',
      'factions',
      'artifacts',
      'relationships',
      'timeline',
      'plot',
      'notes',
      'media',
      'research',
      'maps',
      'canvas',
    ],
    { each: true },
  )
  modules!: string[];
}
@DocumentDto()
export class MapDto extends TitleDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  imageMediaId?: string;
}
@DocumentDto()
export class PointDto {
  @IsNumber() @Min(0) @Max(1) x!: number;
  @IsNumber() @Min(0) @Max(1) y!: number;
}
@DocumentDto()
export class PinDto extends PointDto {
  @IsString() @Length(1, 200) label!: string;
  @IsOptional()
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
  entityKind?: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  entityId?: string;
}
@DocumentDto({ points: () => [PointDto] })
export class RegionDto {
  @IsString() @Length(1, 200) label!: string;
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PointDto)
  points!: PointDto[];
  @IsString() @Matches(/^#[a-fA-F0-9]{6}$/) color!: string;
}
@DocumentDto()
export class CanvasNodeDto {
  @IsIn(['TEXT', 'IMAGE', 'CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'])
  kind!: string;
  @IsString() @Length(0, 4000) text!: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  referenceId?: string;
  @IsNumber() @Min(-100000) @Max(100000) x!: number;
  @IsNumber() @Min(-100000) @Max(100000) y!: number;
  @IsNumber() @Min(20) @Max(4000) width!: number;
  @IsNumber() @Min(20) @Max(4000) height!: number;
}
@DocumentDto()
export class CanvasEdgeDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) sourceId!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) targetId!: string;
  @IsString() @Length(0, 200) label!: string;
}
