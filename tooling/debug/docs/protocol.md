# Debug Protocol

## Establishing the Connection

In an uncertain order, the CLIENT will become
ready, and the SERVER will become ready.

When the CLIENT becomes ready, it should emit
a CLIENT-READY message. When the client receives any
SEVER-READY message, it should re-emit a CLIENT-READY
message in response. A client should then wait until it
receives a SERVER-ACCEPT message.

When a SERVER becomes ready, it should emit a SERVER-READY
message. If the server receives any CLIENT-READY message, it
should emit a SERVER-ACCEPT message.

Once a SERVER-ACCEPT message has been broadcast, the connection
is established.