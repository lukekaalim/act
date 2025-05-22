console.log('I... am a content script!')

const handleMessage = (port: browser.runtime.Port) => {
  console.log('I, the content script, recieved an port!');
  port.onMessage.addListener((message) => {
    console.log('I, the content script, recieved a message!', message);
  })
};

browser.runtime.onConnect.addListener(handleMessage);
