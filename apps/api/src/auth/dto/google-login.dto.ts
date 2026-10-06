import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ minLength: 100, maxLength: 8192 })
  @IsString()
  @Length(100, 8192)
  idToken!: string;

  @ApiProperty({ minLength: 32, maxLength: 128 })
  @IsString()
  @Length(32, 128)
  nonce!: string;
}
