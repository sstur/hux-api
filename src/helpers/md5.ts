import { createHash } from 'crypto';

export default function md5(input: string | Buffer) {
  return createHash('md5')
    .update(input)
    .digest('hex');
}
