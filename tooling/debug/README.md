# @lukekaalim/act-debug

The Debug package contains replacements for
common Act utilities and systems with enhanced debugging capabilities,
as well as type definitions for serialization-friendly data structures
and protocols for command & control systems over event-based protocols.

Essentially, while "act-debug" isn't a debugger itself, it provides
all the tools needed to build one - you just have to provide the
platform specific buses and hooks you'd use for your specific tool.

> Looking for a specific implementation? Check out the [Firefox Web Extension](/)!

## Strategy

To get our greasy hands on the internals of an application, we need
to hijack the Reconciler - which is the entrypoint to all logic, and
replace it with a DebugReconciler.

