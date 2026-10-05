import assert from 'node:assert/strict';
/** Small assertion helper for the JSON schema features present in our OpenAPI 3.0 contracts. */
export function assertSchema(document, schema, value, path = '$') {
  if (schema.$ref) {
    const name = schema.$ref.split('/').at(-1);
    assert.ok(document.components.schemas[name], `Unresolved ${schema.$ref}`);
    return assertSchema(
      document,
      document.components.schemas[name],
      value,
      path,
    );
  }
  if (value === null && schema.nullable) return;
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((branch) => {
      try {
        assertSchema(document, branch, value, path);
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(matches.length, 1, `${path} must match one schema`);
    return;
  }
  if (schema.allOf) {
    for (const branch of schema.allOf)
      assertSchema(document, branch, value, path);
  }
  if (schema.enum)
    assert.ok(schema.enum.includes(value), `${path} invalid enum`);
  if (schema.type === 'object') {
    assert.ok(
      value !== null && typeof value === 'object' && !Array.isArray(value),
      `${path} must be an object`,
    );
    for (const key of schema.required ?? [])
      assert.ok(Object.hasOwn(value, key), `${path}.${key} required`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key])
        assertSchema(document, schema.properties[key], item, `${path}.${key}`);
      else if (schema.additionalProperties === false)
        assert.fail(`${path}.${key} undocumented property`);
    }
  } else if (schema.type === 'array') {
    assert.ok(Array.isArray(value), `${path} must be an array`);
    if (schema.minItems !== undefined)
      assert.ok(value.length >= schema.minItems, `${path} minimum array size`);
    if (schema.maxItems !== undefined)
      assert.ok(value.length <= schema.maxItems, `${path} maximum array size`);
    for (const [index, item] of value.entries())
      assertSchema(document, schema.items, item, `${path}[${index}]`);
  } else if (schema.type === 'integer')
    assert.ok(Number.isInteger(value), `${path} must be integer`);
  else if (schema.type) assert.equal(typeof value, schema.type, `${path} type`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined)
      assert.ok(Array.from(value).length >= schema.minLength);
    if (schema.maxLength !== undefined)
      assert.ok(Array.from(value).length <= schema.maxLength);
    if (schema.pattern)
      assert.ok(new RegExp(schema.pattern).test(value), `${path} pattern`);
    if (schema.format === 'date-time')
      assert.ok(
        !Number.isNaN(Date.parse(value)) && value.endsWith('Z'),
        `${path} ISO timestamp`,
      );
    if (schema.format === 'uuid')
      assert.match(
        value,
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
      );
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum);
  }
}
export function assertOpenApiResponse(document, path, method, status, value) {
  const response =
    document.paths[path]?.[method.toLowerCase()]?.responses[String(status)];
  assert.ok(response, `${method} ${path} ${status} undocumented`);
  const schema = response.content?.['application/json']?.schema;
  assert.ok(schema, `${method} ${path} ${status} missing JSON schema`);
  assertSchema(document, schema, value);
}

export function assertActualResponse(document, path, method, status, value) {
  const pathname = '/api/v1' + path.split('?')[0];
  const template = Object.keys(document.paths).find((p) =>
    new RegExp('^' + p.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(pathname),
  );
  assert.ok(template, 'Undocumented route ' + pathname);
  if (status === 204) {
    assert.ok(document.paths[template][method.toLowerCase()].responses['204']);
    return;
  }
  assertOpenApiResponse(document, template, method, status, value);
}
