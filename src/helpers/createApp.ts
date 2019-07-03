import express, { Express } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';

export default function createApp(): Express {
  const app = express();

  app.use((_req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  app.use(cors());

  app.use(bodyParser.json());

  return app;
}
