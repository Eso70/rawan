import { ApiProperty, type ApiPropertyOptions } from '@nestjs/swagger';
import { getMetadataStorage } from 'class-validator';
/** Swagger properties derive from the same flattened validators used at runtime, including composed helpers. */
export function DocumentDto(
  types: Record<string, () => Function | Function[]> = {},
): ClassDecorator {
  return (target) => {
    const metadata = getMetadataStorage().getTargetValidationMetadatas(
      target,
      '',
      false,
      false,
    );
    for (const name of new Set(metadata.map((m) => m.propertyName))) {
      const fields = metadata.filter((m) => m.propertyName === name);
      const options: ApiPropertyOptions = { required: true, type: String };
      for (const field of fields) {
        const args = (field.constraints ?? []) as unknown[];
        if (
          field.type === 'conditionalValidation' &&
          typeof args[0] === 'function'
        ) {
          const condition = args[0] as (
            object: Record<string, unknown>,
            value: unknown,
          ) => boolean;
          if (!condition({ [name]: undefined }, undefined))
            options.required = false;
          if (!condition({ [name]: null }, null)) options.nullable = true;
        }
        switch (field.name) {
          case 'isInt':
            options.type = 'integer';
            break;
          case 'isArray':
            options.type = 'array';
            options.items = { type: 'string' };
            break;
          case 'isObject':
            options.type =
              (Reflect.getMetadata(
                'design:type',
                target.prototype,
                name,
              ) as Function) ?? Object;
            break;
          case 'isIn':
            options.enum = args[0] as string[];
            break;
          case 'isLength':
            options.minLength = args[0] as number;
            options.maxLength = args[1] as number;
            break;
          case 'minLength':
            options.minLength = args[0] as number;
            break;
          case 'maxLength':
            options.maxLength = args[0] as number;
            break;
          case 'min':
            options.minimum = args[0] as number;
            break;
          case 'max':
            options.maximum = args[0] as number;
            break;
          case 'arrayMinSize':
            options.minItems = args[0] as number;
            break;
          case 'arrayUnique':
            options.description = 'Item IDs and positions must each be unique.';
            break;
          case 'arrayMaxSize':
            options.maxItems = args[0] as number;
            break;
          case 'matches':
            options.pattern = (args[0] as RegExp).source;
            break;
          case 'isEmail':
            options.format = 'email';
            break;
          case 'notContains':
            if (args[0] === '\u0000')
              options.description = 'Must not contain NUL characters.';
            break;
        }
      }
      if (name === 'password') {
        options.format = 'password';
        options.writeOnly = true;
      }
      if (name === 'limit') {
        options.default = 50;
        options.description = 'Maximum page size; default 50, maximum 100.';
      }
      if (name === 'offset') {
        options.default = 0;
        options.description = 'Zero-based offset; maximum 1,000,000.';
      }
      if (types[name]) {
        const selected = types[name]();
        if (Array.isArray(selected)) {
          options.type = selected[0];
          options.isArray = true;
        } else options.type = selected;
        delete options.items;
      }
      ApiProperty(options)(target.prototype, name);
    }
  };
}
