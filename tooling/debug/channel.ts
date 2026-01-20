/*
import { WorkThread, EventEmitter, createEventEmitter } from "@lukekaalim/act-recon"


export const createPostMessageClient = <Incoming, Outgoing>(
  incomingKey: string,
  outgoingKey: string,
): ChannelClient<Incoming, Outgoing> => {
  const events = createEventEmitter<Incoming>();
  const send = (payload: Outgoing) => {
    window.postMessage({
      key: outgoingKey,
      payload,
    })
  };
  window.addEventListener('message', (message) => {
    if (typeof message.data !== "object" || !message.data)
      return;

    if (message.data.key !== incomingKey)
      return;

    events.emit(message.data.payload as Incoming);
  });
  return { send, subscribe: events.subscribe };
}

export const createPortClient = <Incoming, Outgoing>(
  port: browser.runtime.Port
): ChannelClient<Incoming, Outgoing> => {
  const events = createEventEmitter<Incoming>();

  port.onMessage.addListener(message => events.emit(message as Incoming));

  return {
    send(message) {
      port.postMessage(message);
    },
    subscribe: events.subscribe
  }
}

export const createBrowserRuntimeClient = <Incoming, Outgoing>(
  runtime: typeof browser.runtime,
  key: string,
): ChannelClient<Incoming, Outgoing> => {
  const events = createEventEmitter<Incoming>();

  runtime.onMessage.addListener(message => {
    if (message.key === key)
      events.emit(message.payload)
  });

  return {
    send(payload) {
      runtime.sendMessage({ key, payload });
    },
    subscribe: events.subscribe
  }
}

export type ChannelClient<Incoming, Outgoing> = {
  send(message: Outgoing): void,
  subscribe: EventEmitter<Incoming>["subscribe"],
}

export const bridgeChannels = <Left, Right>(
  left: ChannelClient<Left, Right>,
  right: ChannelClient<Right, Left>
) => {
  left.subscribe(event => right.send(event));
  right.subscribe(event => left.send(event));
}
*/