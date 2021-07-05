> Fast, unopinionated, minimalist web framework for Deno Deploy 🦕

Kyuko is an ultra-light framework for API servers hosted on [Deno Deploy](https://deno.com/deploy).

It aims to provide a similar experience to developing API servers with [Express](https://expressjs.com/).

# Hello World

Deployed at https://kyuko.deno.dev

```ts
import { Kyuko } from 'https://raw.githubusercontent.com/rikilele/kyuko/main/kyuko.ts';

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
```
