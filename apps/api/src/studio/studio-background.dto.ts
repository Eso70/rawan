import { ApiProperty } from '@nestjs/swagger';

export class StudioBackgroundResponseDto {
  @ApiProperty({
    type: 'string',
    enum: [
      'spring-dawn',
      'spring-rain',
      'summer-noon',
      'summer-golden-hour',
      'summer-night',
      'autumn-morning',
      'autumn-evening',
      'winter-dawn',
      'winter-night',
      'blue-hour-valley',
    ],
  })
  backgroundId!: string;

  @ApiProperty({ type: 'integer', enum: [300] })
  refreshAfterSeconds!: number;
}
