import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentDto } from '../contracts/document-dto.js';
import { normalizeEmail } from './normalize-email.js';

@DocumentDto()
export class EmailSignupDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @Length(15, 128) @Matches(/\S/) password!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}
@DocumentDto()
export class EmailVerificationIdDto {
  @IsUUID('4') verificationId!: string;
}
@DocumentDto()
export class EmailVerificationDto extends EmailVerificationIdDto {
  @IsString() @Matches(/^\d{8}$/) code!: string;
}
export class EmailChallengeResponse {
  @ApiProperty({ type: 'string', format: 'uuid' }) verificationId!: string;
  @ApiProperty({ type: 'integer', minimum: 1 }) expiresIn!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) resendAfter!: number;
}
