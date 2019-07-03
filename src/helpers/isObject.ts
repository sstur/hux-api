type PlainObject = ObjectOf<unknown>;

function isObject(input: unknown): input is PlainObject {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

export default isObject;
