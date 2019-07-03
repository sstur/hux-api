import { prisma, User } from '../generated/prisma-client';
import { validate } from './signID';

export async function authUser(authToken: unknown): Promise<User | null> {
  let validID = typeof authToken === 'string' ? validate(authToken) : null;
  if (validID) {
    return await prisma.session({ id: validID }).user();
  }
  return null;
}
