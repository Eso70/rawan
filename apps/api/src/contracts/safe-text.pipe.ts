import { BadRequestException, type PipeTransform } from '@nestjs/common';
export class SafeTextPipe implements PipeTransform {
  transform(value: unknown) {
    const inspect = (item: unknown, depth: number) => {
      if (depth > 20)
        throw new BadRequestException('Input nesting limit exceeded');
      if (typeof item === 'string' && item.includes('\u0000'))
        throw new BadRequestException('Text cannot contain null characters');
      if (item && typeof item === 'object')
        for (const nested of Object.values(item)) inspect(nested, depth + 1);
    };
    inspect(value, 0);
    return value;
  }
}
