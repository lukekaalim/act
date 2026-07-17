# @lukekaalim/act

## 5.0.0

### Major Changes

- 2ed02cf: Breaking! Change how useRef works, no longer compatible with React-style.

  New API has `.get` and `.set` properties in order to better type ReadOnlyRef and WriteOnlyRef.

  Add primitive registry to web, remove old element API and replace with "html" and "svg" element maps

## 4.3.0

### Minor Changes

- bf3138f: Added PrimitiveRegistry for dynamically adding more elements to act-three, implemented in backstage

## 4.2.0

### Minor Changes

- Improve debugger support

## 4.1.0

### Minor Changes

- bcbd299: SSR API for @lukekaalim/act-web

### Patch Changes

- beec21c: Fixed Web text element rehydration, remove nodejs dependencies from dehydration

## 4.0.0

### Major Changes

- 6658c01: Internal Refactor!
- afd247e: Another major refactor! So everything is broken. Good luck!

## 3.2.1

### Patch Changes

- Fix typeerror with missing "ref" property on ErrorBoundaryProps

## 3.2.0

### Minor Changes

- Added support for keys/reordering elements without unmounting them

## 3.1.0

### Minor Changes

- 4381035: Added error boundaries
