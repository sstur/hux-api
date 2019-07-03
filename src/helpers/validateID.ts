const validID = /^[0-9a-fA-F]{24}$/;

export function isValidID(input: unknown): input is string {
  return typeof input === 'string' && validID.test(input);
}

export function validateID(id: unknown): string | null {
  return isValidID(id) ? id : null;
}
