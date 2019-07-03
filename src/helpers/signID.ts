import { createHash } from 'crypto';

const key = String(process.env.SESSION_KEY);
const inputLength = 24;
const outputLength = 32;

export function sign(hexID: string): string {
  return (hexID + hash(hexID)).slice(0, outputLength);
}

export function validate(signedHex: string): string | null {
  let hexID = signedHex.slice(0, inputLength);
  return sign(hexID) === signedHex ? hexID : null;
}

function hash(hexID: string) {
  return createHash('sha256')
    .update(Buffer.from(key, 'hex'))
    .update(Buffer.from(hexID, 'hex'))
    .digest('hex');
}
