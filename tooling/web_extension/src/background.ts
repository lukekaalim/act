/// <reference types="@types/firefox-webext-browser" />

console.log('I... am a background script!')

const handleMessage = (event: unknown) => {
  console.log('I, the background script, recieved an event!', event);
  if (event.type === 'devpanel-init') {
    console.log(`launching a connection to ${event.tab}`)
    const port = browser.tabs.connect(event.tab);
    console.log(`Sending ${event.tab} a greeting`)
    port.postMessage({ greeting: "Hi from background script" });
  }
};

browser.runtime.onMessage.addListener(handleMessage);

export {};