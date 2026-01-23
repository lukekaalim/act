import { h, useEffect, useMemo, useState } from '@lukekaalim/act';
import { dehydrate } from '@lukekaalim/act-web/node';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { toHtml } from 'hast-util-to-html';
import { readFile } from 'node:fs/promises';

import { App } from './app';

const main = (port: number = 0) => {
  const onRequest = async (req: IncomingMessage, res: ServerResponse) => {
    let resolve = () => {};
    const state = {};

    const useSSRState = (key, initial) => {
      const [value, setValue] = useState(initial);
      useMemo(() => {
        state[key] = value;
      }, [value])

      return [value, setValue];
    }
    const useSSREffect = useEffect;
    const node = h(App, { useSSRState, useSSREffect, done() {
      resolve()
      console.log('ready')
    } });
    const donePromise = new Promise<void>(r => {
      resolve = r
    });
    const { bundle, root } = await dehydrate(node, donePromise);

    const script = await readFile('./client.js', 'utf-8');
    const css = '';//await readFile('./client.css', 'utf-8');

    const chunk = `
<!DOCTYPE html>
<html>
    <head>
      <style>
      ${css}
      </style>
    </head>
    <body>
      <h1>This is part of the template!</h1>
      <script type="application/json" id="COMMITS">
      ${JSON.stringify(bundle, null, 2)}
      </script>
      <script type="application/json" id="STATE">
      ${JSON.stringify(state, null, 2)}
      </script>
      <div id="ATTACH">
        ${toHtml(root)}
      </div>
      <script type="module">
      ${script}
      </script>
    </body>
</html>
    `
    res.write(chunk);
    res.end();
  }

  const server = createServer(onRequest)

  server.listen(port, () => {
    const port = (server.address() as AddressInfo).port;
    console.log(`Listening on http://localhost:${port}`)
  });

};

main(5555);