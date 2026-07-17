---
"@lukekaalim/act-web": major
"@lukekaalim/act": major
"@lukekaalim/act-three": minor
---

Breaking! Change how useRef works, no longer compatible with React-style.

New API has `.get` and `.set` properties in order to better type ReadOnlyRef and WriteOnlyRef.

Add primitive registry to web, remove old element API and replace with "html" and "svg" element maps
