# @lukekaalim/act-recon

## 3.1.0

### Minor Changes

- bcbd299: SSR API for @lukekaalim/act-web

### Patch Changes

- beec21c: Fixed Web text element rehydration, remove nodejs dependencies from dehydration
- Updated dependencies [bcbd299]
- Updated dependencies [beec21c]
  - @lukekaalim/act@4.1.0

## 3.0.0

### Major Changes

- 6658c01: Internal Refactor!
- afd247e: Another major refactor! So everything is broken. Good luck!
- b3f6c49: Added debug capabilities and protocol

### Patch Changes

- fdf1557: Fixed issue with multiple changes (where changes after first were children of first) being ignored due to "MustVisit" being misinput each time
- ccb3900: Reconciler should apply all changes in the correct order, and not skip any.
  - Reconciler does send out a Render command once it completes all pending renders (called a "ThreadStack")
    Scheduler has been updated to perform some updates in Sync.
- 2984273: Check if immediate child update is already handlded by some other system (avoiding double-rendering)
- c5e8775: Fix context updates not actually being pushed to the MustRender list
- Updated dependencies [6658c01]
- Updated dependencies [afd247e]
  - @lukekaalim/act@4.0.0

## 3.0.0-alpha.4

### Patch Changes

- 2984273: Check if immediate child update is already handlded by some other system (avoiding double-rendering)

## 3.0.0-alpha.3

### Patch Changes

- ccb3900: Reconciler should apply all changes in the correct order, and not skip any.
  - Reconciler does send out a Render command once it completes all pending renders (called a "ThreadStack")
    Scheduler has been updated to perform some updates in Sync.

## 3.0.0-alpha.2

### Patch Changes

- c5e8775: Fix context updates not actually being pushed to the MustRender list

## 3.0.0-alpha.1

### Patch Changes

- fdf1557: Fixed issue with multiple changes (where changes after first were children of first) being ignored due to "MustVisit" being misinput each time

## 3.0.0-alpha.0

### Major Changes

- b3f6c49: Added debug capabilities and protocol

## 2.0.0

### Major Changes

- Scheduling refactor

## 1.2.0

### Minor Changes

- Added support for keys/reordering elements without unmounting them

### Patch Changes

- Updated dependencies
  - @lukekaalim/act@3.2.0

## 1.1.2

### Patch Changes

- e2f7db4: Fix context hooks not properly incrementing their hookIndex, causing the same value to be returned for each subsequent useContext call

## 1.1.1

### Patch Changes

- 0017c07: Fix packages emitting debugging console logs

## 1.1.0

### Minor Changes

- 4381035: Added error boundaries

### Patch Changes

- Updated dependencies [4381035]
  - @lukekaalim/act@3.1.0
