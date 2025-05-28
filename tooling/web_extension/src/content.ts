import { DebuggerClient } from "@lukekaalim/act-debug";

console.log('I... am a content script!')

const handleMessage = (port: browser.runtime.Port) => {
  console.log('I, the content script, recieved an port!');
  port.onMessage.addListener((message) => {
    console.log('I, the content script, recieved a message!', message);
  })
};

browser.runtime.onConnect.addListener(handleMessage);

const createWebExtensionDebuggerClient = (): DebuggerClient => {
  window.addEventListener('message', (message) => {
    console.log('WEB EXTENSION', message)
  });
  window.postMessage({ naaaa: 'nahahaha' })

  return {
    startThread(thread) {
      console.log('startThread', thread);
    },
    updateThread(thread) {
      console.log('updateThread', thread);
    },
    finishThread(thread) {
      console.log('finishThread', thread);
    },
    ready() {
      console.log('ready')
    },
    requestWork() {
      console.log('request-work')
    },
    on(type, handler) {
      console.log('on', type, handler);
    },
  };
}


createWebExtensionDebuggerClient();