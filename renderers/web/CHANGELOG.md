# @lukekaalim/act-web

## 5.1.1

### Patch Changes

- 114c53f: Fix issue with adding/remove ref props from Web elements

## 5.1.0

### Minor Changes

- Improve debugger support

### Patch Changes

- Updated dependencies
  - @lukekaalim/act-recon@4.0.0
  - @lukekaalim/act@4.2.0
  - @lukekaalim/act-backstage@3.1.1

## 5.0.0

### Major Changes

- bcbd299: SSR API for @lukekaalim/act-web

### Minor Changes

- beec21c: Fixed Web text element rehydration, remove nodejs dependencies from dehydration

### Patch Changes

- Updated dependencies [bcbd299]
- Updated dependencies [beec21c]
  - @lukekaalim/act-backstage@3.1.0
  - @lukekaalim/act-recon@3.1.0
  - @lukekaalim/act@4.1.0

## 4.0.0

### Major Changes

- 6658c01: Internal Refactor!
- afd247e: Another major refactor! So everything is broken. Good luck!

### Minor Changes

- bd0a076: Add support for data-\* attributes on HTML elements
- b3f6c49: Added debug capabilities and protocol

### Patch Changes

- 7597a8f: Added "Style" prop support to SVG
- ccb3900: Reconciler should apply all changes in the correct order, and not skip any.
  - Reconciler does send out a Render command once it completes all pending renders (called a "ThreadStack")
    Scheduler has been updated to perform some updates in Sync.
- Updated dependencies [6658c01]
- Updated dependencies [fdf1557]
- Updated dependencies [ccb3900]
- Updated dependencies [afd247e]
- Updated dependencies [2984273]
- Updated dependencies [b3f6c49]
- Updated dependencies [c5e8775]
  - @lukekaalim/act-backstage@3.0.0
  - @lukekaalim/act-recon@3.0.0
  - @lukekaalim/act@4.0.0

## 3.4.0-alpha.3

### Patch Changes

- ccb3900: Reconciler should apply all changes in the correct order, and not skip any.
  - Reconciler does send out a Render command once it completes all pending renders (called a "ThreadStack")
    Scheduler has been updated to perform some updates in Sync.
- Updated dependencies [ccb3900]
  - @lukekaalim/act-recon@3.0.0-alpha.3

## 3.4.0-alpha.2

### Minor Changes

- Add support for data-\* attributes on HTML elements

## 3.4.0-alpha.1

### Patch Changes

- Added "Style" prop support to SVG

## 3.4.0-alpha.0

### Minor Changes

- b3f6c49: Added debug capabilities and protocol

### Patch Changes

- Updated dependencies [b3f6c49]
  - @lukekaalim/act-backstage@3.0.0-alpha.0
  - @lukekaalim/act-recon@3.0.0-alpha.0

## 3.3.0

### Minor Changes

- Scheduling refactor

### Patch Changes

- Updated dependencies
  - @lukekaalim/act-backstage@2.0.0
  - @lukekaalim/act-recon@2.0.0

## 3.2.2

### Patch Changes

- cece5b4: Fixes CSS vars in the "style" prop not being applied

## 3.2.1

### Patch Changes

- 0017c07: Fix packages emitting debugging console logs
- Updated dependencies [0017c07]
  - @lukekaalim/act-backstage@1.2.1
  - @lukekaalim/act-recon@1.1.1

## 3.2.0

### Minor Changes

- 4381035: Added error boundaries

### Patch Changes

- Updated dependencies [4381035]
  - @lukekaalim/act-backstage@1.2.0
  - @lukekaalim/act-recon@1.1.0
  - @lukekaalim/act@3.1.0
