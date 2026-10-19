import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateIf,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
  discoverySources,
  SETUP_STEPS,
} from '@rawan/types/onboarding';
const choices = (groups: typeof creativeGroups) =>
  groups.flatMap((group) => group.options.map((option) => option.value));
const optional = (o: object, key: string) =>
  (o as Record<string, unknown>)[key] !== undefined;

export class UpdateSetupDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(2147483646)
  expectedRevision!: number;
  @ApiPropertyOptional({ maxLength: 80 })
  @ValidateIf((o) => optional(o, 'preferredName'))
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : value,
  )
  preferredName?: string;
  @ApiPropertyOptional({ enum: ['create', 'read', 'both'], nullable: true })
  @ValidateIf((o) => optional(o, 'purpose') && o.purpose !== null)
  @IsIn(['create', 'read', 'both'])
  purpose?: 'create' | 'read' | 'both' | null;
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((o) => optional(o, 'creativeInterests'))
  @IsArray()
  @ArrayMaxSize(choices(creativeGroups).length)
  @ArrayUnique()
  @IsIn(choices(creativeGroups), { each: true })
  creativeInterests?: string[];
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((o) => optional(o, 'readingFormats'))
  @IsArray()
  @ArrayMaxSize(choices(readingFormatGroups).length)
  @ArrayUnique()
  @IsIn(choices(readingFormatGroups), { each: true })
  readingFormats?: string[];
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((o) => optional(o, 'readingGenres'))
  @IsArray()
  @ArrayMaxSize(choices(readingGenreGroups).length)
  @ArrayUnique()
  @IsIn(choices(readingGenreGroups), { each: true })
  readingGenres?: string[];
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((o) => optional(o, 'readingTopics'))
  @IsArray()
  @ArrayMaxSize(choices(readingTopicGroups).length)
  @ArrayUnique()
  @IsIn(choices(readingTopicGroups), { each: true })
  readingTopics?: string[];
  @ApiPropertyOptional({ enum: ['en'] })
  @ValidateIf((o) => optional(o, 'interfaceLanguage'))
  @IsIn(['en'])
  interfaceLanguage?: 'en';
  @ApiPropertyOptional({ enum: discoverySources, nullable: true })
  @ValidateIf(
    (o) => optional(o, 'discoverySource') && o.discoverySource !== null,
  )
  @IsIn(discoverySources)
  discoverySource?: string | null;
  @ApiPropertyOptional({ maxLength: 120 })
  @ValidateIf((o) => optional(o, 'discoveryOther'))
  @IsString()
  @MaxLength(120)
  discoveryOther?: string;
  @ApiPropertyOptional({ enum: ['studio', 'reader'], nullable: true })
  @ValidateIf((o) => optional(o, 'preferredStart') && o.preferredStart !== null)
  @IsIn(['studio', 'reader'])
  preferredStart?: 'studio' | 'reader' | null;
  @ApiPropertyOptional({ enum: SETUP_STEPS })
  @ValidateIf((o) => optional(o, 'step'))
  @IsIn(SETUP_STEPS)
  step?: (typeof SETUP_STEPS)[number];
  @ApiPropertyOptional({ enum: [true] })
  @ValidateIf((o) => optional(o, 'complete'))
  @IsIn([true])
  complete?: boolean;
}
export class SetupDraftResponseDto {
  @ApiProperty() preferredName!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['create', 'read', 'both'],
  })
  purpose!: string | null;
  @ApiProperty({ type: [String] }) creativeInterests!: string[];
  @ApiProperty({ type: [String] }) readingFormats!: string[];
  @ApiProperty({ type: [String] }) readingGenres!: string[];
  @ApiProperty({ type: [String] }) readingTopics!: string[];
  @ApiProperty({ enum: ['en'] }) interfaceLanguage!: string;
  @ApiProperty({ type: String, nullable: true }) discoverySource!:
    string | null;
  @ApiProperty() discoveryOther!: string;
  @ApiProperty({ type: String, nullable: true, enum: ['studio', 'reader'] })
  preferredStart!: string | null;
}
export class SetupResponseDto {
  @ApiProperty({ enum: [1] }) version!: number;
  @ApiProperty({ enum: ['not_started', 'in_progress', 'completed'] })
  status!: string;
  @ApiProperty() required!: boolean;
  @ApiProperty() revision!: number;
  @ApiProperty({ enum: SETUP_STEPS }) step!: string;
  @ApiProperty({ type: SetupDraftResponseDto }) draft!: SetupDraftResponseDto;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;
}
