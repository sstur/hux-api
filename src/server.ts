import dotenv from 'dotenv';
import createApp from './helpers/createApp';

import users from './controllers/users';
import posts from './controllers/posts';

dotenv.config();

const hostname = '127.0.0.1';
const port = 8000;

const app = createApp();

app.get('/', (req, res) => {
  console.log('Request:', req.method, req.url);
  res.set('Content-Type', 'text/plain');
  res.send('Hello World.\n');
});

users(app);
posts(app);

app.use((_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(404).send('Not Found.\n');
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
