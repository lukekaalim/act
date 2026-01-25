import { h, useEffect, useMemo, useState } from '@lukekaalim/act';
import { dehydrate } from '@lukekaalim/act-web/node';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { toHtml } from 'hast-util-to-html';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { App } from './app';

const main = (port: number = 0) => {
  const onRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/client.js') {
      res.setHeader('content-type', 'text/javascript')
      createReadStream('./client.js').pipe(res);
      return;
    }

    const node = h(App);
    const { payload, root } = await dehydrate(node, { App });

    const css = ``;//await readFile('./client.css', 'utf-8');

    const chunk = `
<!DOCTYPE html>
<html>
    <head>
      <style>
      ${css}
      </style>
    </head>
    <body>
      <script type="application/json" id="SSR-DATA">${JSON.stringify(payload, null, 2)}</script>

      <div id="SSR-ROOT">
        ${toHtml(root)}
      </div>
      <script type="module" src="/client.js"></script>
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