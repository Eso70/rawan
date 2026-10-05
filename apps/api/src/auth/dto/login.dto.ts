import { DocumentDto } from '../../contracts/document-dto.js';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { normalizeEmail } from '../normalize-email.js';

@DocumentDto()
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // Existing accounts may predate the new registration minimum.
  @IsString()
  @Length(1, 128)
  password!: string;
}
