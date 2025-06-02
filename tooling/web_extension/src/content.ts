import {
  bridgeChannels,
  createPortClient,
  createPostMessageClient,
} from "@lukekaalim/act-debug";

const main = () => {
  const handlePort = (port: browser.runtime.Port) => {
    console.log('I, the content script, recieved an port!');

    bridgeChannels(
      createPostMessageClient(
        '@lukekaalim/act-debug:target',
        '@lukekaalim/act-debug:debugger',
      ),
      createPortClient(port)
    );
  };
  browser.runtime.onConnect.addListener(handlePort);
};


main();