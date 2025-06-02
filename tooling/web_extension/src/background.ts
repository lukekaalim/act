/// <reference types="@types/firefox-webext-browser" />
import {
  bridgeChannels,
  createBrowserRuntimeClient,
  createPortClient
} from "@lukekaalim/act-debug";

console.log('I... am a background script!')

const initTabBridge = (port: browser.runtime.Port) => {
  const contentClient = createPortClient(port);
  const devtoolsClient = createBrowserRuntimeClient(
    browser.runtime,
    '@lukekaalim/act-debug:background-to-devtools'
  )
  bridgeChannels(contentClient, devtoolsClient);
}

const main = () => {
  const handleMessage = (event: unknown) => {
    if (event.type === 'devpanel-init') {
      console.log('I, the background script, recieved an event!', event);
      console.log(`launching a connection to ${event.tab}`)
  
      const port = browser.tabs.connect(event.tab);
      initTabBridge(port);
    }
  };
  
  browser.runtime.onMessage.addListener(handleMessage);
}

main();
