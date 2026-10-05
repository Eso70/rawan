import { DocumentDto } from '../contracts/document-dto.js';
import { TextQueryDto, queryId } from '../query/query.dto.js';
import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
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
  ValidateNested,
} from 'class-validator';
import type { PlotPointStatus, WorldEntityKind } from '@rawan/types';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
const title = () => applyDecorators(trim(), IsString(), Length(1, 200));
const optionalTitle = () =>
  applyDecorators(
    ValidateIf((_o, v: unknown) => v !== undefined),
    title(),
  );
const description = () =>
  applyDecorators(IsOptional(), IsString(), MaxLength(10000));
const position = () =>
  applyDecorators(
    ValidateIf((_o, v: unknown) => v !== undefined),
    IsInt(),
    Min(0),
    Max(2147483647),
  );
const id = () =>
  applyDecorators(IsString(), Length(1, 128), Matches(/^[a-zA-Z0-9_-]+$/));
const label = () =>
  applyDecorators(IsOptional(), trim(), IsString(), Length(1, 100));
const status = () =>
  applyDecorators(
    ValidateIf((_o, v: unknown) => v !== undefined),
    IsIn(['PLANNED', 'IN_PROGRESS', 'RESOLVED']),
  );
@DocumentDto()
export class CreatePlotDto {
  @title() title!: string;
  @description() description?: string | null;
  @label() category?: string | null;
  @position() position?: number;
}
@DocumentDto()
export class UpdatePlotDto {
  @optionalTitle() title?: string;
  @description() description?: string | null;
  @label() category?: string | null;
  @position() position?: number;
}
@DocumentDto()
export class CreatePlotPointDto {
  @title() title!: string;
  @description() description?: string | null;
  @position() position?: number;
  @status() status?: PlotPointStatus;
}
@DocumentDto()
export class UpdatePlotPointDto {
  @optionalTitle() title?: string;
  @description() description?: string | null;
  @position() position?: number;
  @status() status?: PlotPointStatus;
}
@DocumentDto()
export class ReorderItemDto {
  @id() id!: string;
  @IsInt() @Min(0) @Max(2147483647) position!: number;
}
@DocumentDto({ items: () => [ReorderItemDto] })
export class ReorderPlotPointsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique((item: ReorderItemDto) => item?.id)
  @ArrayUnique((item: ReorderItemDto) => item?.position)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
@DocumentDto()
export class AttachPlotPointSceneDto {
  @id() sceneId!: string;
}
@DocumentDto()
export class AttachPlotPointEventDto {
  @id() eventId!: string;
}
@DocumentDto()
export class AttachPlotPointEntityDto {
  @IsIn(['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT']) kind!: WorldEntityKind;
  @id() entityId!: string;
  @label() role?: string | null;
}
@DocumentDto()
export class PlotPageQueryDto extends TextQueryDto {
  @ValidateIf((_o, v: unknown) => v !== undefined)
  @IsIn(['title', 'position', 'createdAt', 'updatedAt'])
  sort?: 'title' | 'position' | 'createdAt' | 'updatedAt';
}
@DocumentDto()
export class PlotPointQueryDto extends PlotPageQueryDto {
  @status() status?: PlotPointStatus;
  @queryId() tagId?: string;
}
