import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DocumentDto } from '../contracts/document-dto.js';
import { SupplementSelectionDto } from '../publication/publication.dto.js';

@DocumentDto()
export class ImportAssetDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) mediaId!: string;
}
@DocumentDto()
export class ComicDto {
  @IsString() @Length(1, 200) title!: string;
  @IsIn(['PAGED', 'VERTICAL']) layout!: string;
  @IsIn(['LTR', 'RTL']) direction!: string;
}
@DocumentDto()
export class ComicPageDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) assetId!: string;
  @IsInt() @Min(0) @Max(10000) position!: number;
  @IsString() @Length(1, 2000) altText!: string;
  @IsString() @Length(0, 20000) transcript!: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,80}$/)
  spreadGroup?: string;
}
@DocumentDto()
export class UpdateComicPageDto extends ComicPageDto {
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
}
@DocumentDto()
export class PanelDto {
  @IsInt() @Min(0) @Max(1000) position!: number;
  @IsNumber() @Min(0) @Max(1) x!: number;
  @IsNumber() @Min(0) @Max(1) y!: number;
  @IsNumber() @Min(0.001) @Max(1) width!: number;
  @IsNumber() @Min(0.001) @Max(1) height!: number;
  @IsString() @Length(0, 2000) altText!: string;
}
@DocumentDto({ panels: () => [PanelDto] })
export class PanelsDto {
  @IsInt() @Min(0) @Max(2147483646) expectedRevision!: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PanelDto)
  panels!: PanelDto[];
}
@DocumentDto()
export class ScriptDto {
  @IsInt() @Min(0) @Max(1000) position!: number;
  @IsIn(['ACTION', 'DIALOGUE', 'CAPTION', 'SFX']) kind!: string;
  @IsString() @Length(1, 4000) text!: string;
  @IsOptional() @IsString() @Length(1, 200) speakerName?: string;
}
@DocumentDto()
export class AppearanceDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) projectId!: string;
  @IsIn(['CHARACTER', 'PLACE']) kind!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) entityId!: string;
}
@DocumentDto({ supplements: () => [SupplementSelectionDto] })
export class GraphicReleaseDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  assetIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/, { each: true })
  relatedIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SupplementSelectionDto)
  supplements?: SupplementSelectionDto[];
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) comicId!: string;
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,128}$/)
  editionId?: string;
}
@DocumentDto()
export class ExportDto {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,128}$/) releaseId!: string;
  @IsIn(['TXT', 'HTML', 'EPUB']) format!: string;
}
export class AssetRenditionResponse {
  @ApiProperty() role!: string;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeBytes!: number;
}
export class AssetResponse {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty({ enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;
  @ApiProperty() attempts!: number;
  @ApiProperty({ type: 'string', nullable: true }) errorCode!: string | null;
  @ApiProperty({ type: () => [AssetRenditionResponse] })
  renditions!: AssetRenditionResponse[];
}
export class ComicResponse extends ComicDto {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() revision!: number;
}
export class PanelResponse extends PanelDto {
  @ApiProperty() id!: string;
  @ApiProperty() pageId!: string;
}
export class ScriptResponse extends ScriptDto {
  @ApiProperty() id!: string;
  @ApiProperty() pageId!: string;
}
export class AppearanceResponse extends AppearanceDto {
  @ApiProperty() id!: string;
  @ApiProperty() pageId!: string;
}
export class ComicPageResponse extends ComicPageDto {
  @ApiProperty() id!: string;
  @ApiProperty() comicId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: () => [PanelResponse], required: false })
  panels?: PanelResponse[];
  @ApiProperty({ type: () => [ScriptResponse], required: false })
  scripts?: ScriptResponse[];
  @ApiProperty({ type: () => [AppearanceResponse], required: false })
  appearances?: AppearanceResponse[];
}
export class GraphicPageResponse {
  @ApiProperty() id!: string;
  @ApiProperty() releaseId!: string;
  @ApiProperty() assetId!: string;
  @ApiProperty() position!: number;
  @ApiProperty() altText!: string;
  @ApiProperty() transcript!: string;
  @ApiProperty({ type: 'string', nullable: true }) spreadGroup!: string | null;
  @ApiProperty({ type: () => [PanelDto] }) panels!: PanelDto[];
}
export class ExportResponse {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() sourceReleaseId!: string;
  @ApiProperty({ enum: ['TXT', 'HTML', 'EPUB'] }) format!: string;
  @ApiProperty({ enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;
  @ApiProperty() attempts!: number;
  @ApiProperty({ type: 'string', nullable: true }) errorCode!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  completedAt!: string | null;
}
