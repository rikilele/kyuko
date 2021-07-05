import { Kyuko } from '../mod.ts';

const app = new Kyuko();

app.get('/', () => {
  return new Response('Hello World!');
});

app.get('/:name', (req) => {
  return new Response(`Hello ${req.params.name}!`);
});

// json request bodies are loaded into req.requestBody by default
app.post('/', (req) => {
  const { name } = req.requestBody;
  return new Response(`Hello ${name}!`);
});

app.listen();
