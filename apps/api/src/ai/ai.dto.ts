import { DocumentDto } from '../contracts/document-dto.js';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
  NotContains,
  ValidateNested,
} from 'class-validator';
import type { AiContextKind, AiTaskType } from '@rawan/types';
import { optionalQuery, PaginationQueryDto } from '../query/query.dto.js';
@DocumentDto()
export class AiContextDto {
  @IsIn(['SCENE', 'CHARACTER', 'TIMELINE_EVENT', 'PLOT_POINT', 'NOTE'])
  kind!: AiContextKind;
  @IsString() @Length(1, 128) @Matches(/^[a-zA-Z0-9_-]+$/) id!: string;
}
@DocumentDto({ context: () => [AiContextDto] })
export class CreateAiDto {
  @IsIn(['BRAINSTORM', 'SUMMARIZE', 'REWRITE']) task!: AiTaskType;
  @IsString() @Length(1, 2000) @NotContains('\u0000') instructions!: string;
  @optionalQuery()
  @IsString()
  @MaxLength(8000)
  @NotContains('\u0000')
  inputText?: string;
  @optionalQuery()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => AiContextDto)
  context?: AiContextDto[];
}
@DocumentDto()
export class AiListDto extends PaginationQueryDto {
  @optionalQuery() @IsIn(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']) status?:
    'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
