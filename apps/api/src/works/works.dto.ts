import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import type { ApiWork, ApiWorkSource } from '@rawan/types';
import { DocumentDto } from '../contracts/document-dto.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '../manuscript/manuscript.dto.js';

@DocumentDto()
export class CreateWorkDto extends CreateProjectDto {}

@DocumentDto()
export class UpdateWorkDto extends UpdateProjectDto {}

@DocumentDto()
export class AddWorkSourceDto {
  @IsString()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  projectId!: string;

  @IsString()
  @Length(1, 128)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  bookId!: string;
}

export class ApiWorkDto implements ApiWork {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: 'string', nullable: true }) description!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: 'string', format: 'date-time' }) updatedAt!: string;
}

export class ApiWorkSourceDto implements ApiWorkSource {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() projectId!: string;
  @ApiProperty() bookId!: string;
  @ApiProperty({ type: 'string', format: 'date-time' }) createdAt!: string;
}
