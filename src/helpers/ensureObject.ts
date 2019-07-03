import isObject from './isObject';

function ensureObject(input: unknown): ObjectOf<unknown> {
  return isObject(input) ? input : {};
}

export default ensureObject;
