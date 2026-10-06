import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  ValidateIf,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateOnboardingDto {
  @ApiPropertyOptional({ enum: ['mirewalker', 'outlook', 'harbor'] })
  @ValidateIf((o: UpdateOnboardingDto) => o.draftImage !== undefined)
  @IsIn(['mirewalker', 'outlook', 'harbor'])
  draftImage?: string;
  @ApiPropertyOptional({ maxLength: 100 })
  @ValidateIf((o: UpdateOnboardingDto) => o.draftRole !== undefined)
  @IsString()
  @MaxLength(100)
  draftRole?: string;
  @ApiPropertyOptional({
    enum: ['ttrpg', 'fiction', 'worldbuilding', 'film', 'game', 'other'],
  })
  @ValidateIf((o: UpdateOnboardingDto) => o.storyType !== undefined)
  @IsIn(['ttrpg', 'fiction', 'worldbuilding', 'film', 'game', 'other'])
  storyType?: string;
  @ApiPropertyOptional({ enum: ['choice', 'intro', 'tour'] })
  @ValidateIf((o: UpdateOnboardingDto) => o.phase !== undefined)
  @IsIn(['choice', 'intro', 'tour'])
  phase?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 4 })
  @ValidateIf((o: UpdateOnboardingDto) => o.step !== undefined)
  @IsInt()
  @Min(0)
  @Max(4)
  step?: number;
  @ApiPropertyOptional({ enum: [true] })
  @ValidateIf((o: UpdateOnboardingDto) => o.complete !== undefined)
  @IsIn([true])
  complete?: boolean;
  @ApiPropertyOptional()
  @ValidateIf((o: UpdateOnboardingDto) => o.skipped !== undefined)
  @IsBoolean()
  skipped?: boolean;
  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @ValidateIf((o: UpdateOnboardingDto) => o.draftName !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  draftName?: string;
  @ApiPropertyOptional({ maxLength: 5000 })
  @ValidateIf((o: UpdateOnboardingDto) => o.draftText !== undefined)
  @IsString()
  @MaxLength(5000)
  draftText?: string;
}
export class OnboardingResponseDto {
  @ApiProperty() draftImage!: string;
  @ApiProperty() draftRole!: string;
  @ApiProperty({ type: 'string', nullable: true }) storyType!: string | null;
  @ApiProperty({ enum: ['choice', 'intro', 'tour'] }) phase!: string;
  @ApiProperty({ minimum: 0, maximum: 4 }) step!: number;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  completedAt!: string | null;
  @ApiProperty() skipped!: boolean;
  @ApiProperty() draftName!: string;
  @ApiProperty() draftText!: string;
}
