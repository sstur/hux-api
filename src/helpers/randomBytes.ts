import crypto from 'crypto';

export default function randomBytes(n: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(n, (error, result) => {
      error ? reject(error) : resolve(result);
    });
  });
}
