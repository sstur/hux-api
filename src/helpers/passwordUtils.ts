import { createHash } from 'crypto';
import randomBytes from './randomBytes';

export async function encryptPassword(password: string) {
  let salt = await randomBytes(8);
  let hashed = createHash('sha256')
    .update(salt)
    .update(password, 'utf8')
    .digest('hex');
  return salt.toString('hex') + ':' + hashed;
}

export function checkPassword(password: string, encrypted: string) {
  let [salt, hashed] = encrypted.split(':');
  let result = createHash('sha256')
    .update(Buffer.from(salt, 'hex'))
    .update(password, 'utf8')
    .digest('hex');
  return result === hashed;
}
