import { Express } from 'express';
import sendgrid from '@sendgrid/mail';
import { validate as isEmail } from 'isemail';

import { prisma } from '../generated/prisma-client';
import ensureObject from '../helpers/ensureObject';
import randomBytes from '../helpers/randomBytes';
import md5 from '../helpers/md5';
import isValidPhoto from '../helpers/isValidPhoto';
import { sign } from '../helpers/signID';
import { encryptPassword, checkPassword } from '../helpers/passwordUtils';
import { authUser } from '../helpers/session';
import { BAD_REQUEST, FORBIDDEN } from '../constants/response';

export default (app: Express) => {
  app.get('/users/me', async (req, res) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    res.send({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      },
    });
  });

  app.post('/users', async (req, res) => {
    let { name, email } = ensureObject(req.body);
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      !isEmail(email)
    ) {
      return res.status(400).send(BAD_REQUEST);
    }
    let buffer = await randomBytes(4);
    let passcode = (buffer.readUInt32BE(0) % 1e6).toString().padStart(6, '0');
    let encrypted = await encryptPassword(passcode);
    let emailLower = email.toLowerCase();
    let hashedEmail = md5(emailLower);
    try {
      await prisma.createUser({
        name,
        email: emailLower,
        password: encrypted,
        photo: `https://s.gravatar.com/avatar/${hashedEmail}?s=256`,
      });
    } catch (error) {
      // Most likely the error is:
      // `A unique constraint would be violated on User. Details: Field name = email`
      return res.status(409).send({ error: error.message });
    }
    let apiKey = String(process.env.SENDGRID_API_KEY);
    sendgrid.setApiKey(apiKey);
    let msg = {
      to: email,
      from: 'no-reply@huxapp.com',
      subject: 'Email Verification',
      text: `Please use code ${passcode} to authenticate.`,
    };
    await sendgrid.send(msg);
    res.json({ success: true });
  });

  app.post('/auth', async (req, res) => {
    let { email, password } = ensureObject(req.body);
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).send(BAD_REQUEST);
    }
    let user = await prisma.user({ email });
    if (user != null && checkPassword(password, user.password)) {
      let session = await prisma.createSession({
        user: { connect: { id: user.id } },
      });
      res.send({
        success: true,
        authToken: sign(session.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          photo: user.photo,
        },
      });
    } else {
      res.send({ success: false });
    }
  });

  app.put('/users', async (req, res) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let { name, photo } = ensureObject(req.body);
    if (typeof name !== 'string' || !name.trim().length) {
      return res.status(400).send(BAD_REQUEST);
    }
    await prisma.updateUser({
      data: isValidPhoto(photo)
        ? { name: name.trim(), photo }
        : { name: name.trim() },
      where: { id: user.id },
    });
    res.json({ success: true });
  });
};
