import { h } from "@lukekaalim/act";
import { createBrowserRuntimeClient, createDebuggerServer } from "@lukekaalim/act-debug";
import { InsightApp2 } from "@lukekaalim/act-insight";
import { render } from "@lukekaalim/act-web";

console.log('I... am a devpanel script!')

browser.runtime.sendMessage({
  type: 'devpanel-init',
  tab: browser.devtools.inspectedWindow.tabId
})

const server = createDebuggerServer(createBrowserRuntimeClient(
  browser.runtime,
  '@lukekaalim/act-debug:background-to-devtools'
));

server.subscribe((event) => {
  console.log(`Devpanel recieved message`, event);
  switch (event.type) {
    case 'target:ready':
      server.accept();
      break;
    case 'work:request':
      server.work();
      break;
  }
})

render(h(InsightApp2, { server }), document.body)

export {};