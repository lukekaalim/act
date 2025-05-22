console.log('I... am a devpanel script!')

const handleMessage = (event: unknown) => {
  console.log('I, the devpanel, recieved an event!', event)
};

browser.runtime.onMessage.addListener(handleMessage);

browser.runtime.sendMessage({
  type: 'devpanel-init',
  tab: browser.devtools.inspectedWindow.tabId
})

export {};