# @lukekaalim/act-three

## 8.3.1

### Patch Changes

- 363c7c2: Fix act-three default render function actually attaching window output to anything

## 8.3.0

### Minor Changes

- bd1062a: Added new RenderRoot arguments to various RenderSpace methods, so builders can customise root handling per RenderRoot props

### Patch Changes

- Updated dependencies [bd1062a]
  - @lukekaalim/act-backstage@5.0.0
  - @lukekaalim/act-web@6.4.0

## 8.2.0

### Minor Changes

- 41b49aa: Upgraded NodeBuilder to pass element during destruction, fixed Sprites not being assigned materials in act-three, and act-three objects will set ref to null on destruction

### Patch Changes

- Updated dependencies [41b49aa]
  - @lukekaalim/act-backstage@4.0.0
  - @lukekaalim/act-web@6.2.1

## 8.1.0

### Minor Changes

- 2ed02cf: Breaking! Change how useRef works, no longer compatible with React-style.

  New API has `.get` and `.set` properties in order to better type ReadOnlyRef and WriteOnlyRef.

  Add primitive registry to web, remove old element API and replace with "html" and "svg" element maps

### Patch Changes

- Updated dependencies [2ed02cf]
  - @lukekaalim/act-web@6.0.0
  - @lukekaalim/act@5.0.0
  - @lukekaalim/act-recon@4.0.1
  - @lukekaalim/act-backstage@3.2.1

## 8.0.3

### Patch Changes

- 0378003: Fix issue with act-three always settings geometry and materials to props, even if left to undefined (resulting in geo/mats being set to undefined even if they exist)

## 8.0.2

### Patch Changes

- 36412c6: Fix issue with threejs builder trying to build non-primirive elements

## 8.0.1

### Patch Changes

- 4168a3d: Lie about the ReadOnly nature of a Ref passes to an element to avoid obscure type issues

## 8.0.0

### Major Changes

- bf3138f: Added PrimitiveRegistry for dynamically adding more elements to act-three, implemented in backstage

### Patch Changes

- Updated dependencies [bf3138f]
  - @lukekaalim/act-backstage@3.2.0
  - @lukekaalim/act-web@5.2.0
  - @lukekaalim/act@4.3.0

## 7.1.2

### Patch Changes

- Fix missing package.json updates from last patch

## 7.1.1

### Patch Changes

- Fixed act-three not being delcared a module, update main export to "index.ts" from "mod.ts"

## 7.1.0

### Minor Changes

- Update threejs dependency to 0.185

## 7.0.2

### Patch Changes

- Updated dependencies
  - @lukekaalim/act-recon@4.0.0
  - @lukekaalim/act@4.2.0
  - @lukekaalim/act-web@5.1.0
  - @lukekaalim/act-backstage@3.1.1

## 7.0.1

### Patch Changes

- Updated dependencies [bcbd299]
- Updated dependencies [beec21c]
  - @lukekaalim/act-web@5.0.0
  - @lukekaalim/act-backstage@3.1.0
  - @lukekaalim/act-recon@3.1.0
  - @lukekaalim/act@4.1.0

## 7.0.0

### Major Changes

- afd247e: Another major refactor! So everything is broken. Good luck!

### Minor Changes

- b3f6c49: Added debug capabilities and protocol

### Patch Changes

- Updated dependencies [6658c01]
- Updated dependencies [bd0a076]
- Updated dependencies [fdf1557]
- Updated dependencies [7597a8f]
- Updated dependencies [ccb3900]
- Updated dependencies [afd247e]
- Updated dependencies [2984273]
- Updated dependencies [b3f6c49]
- Updated dependencies [c5e8775]
  - @lukekaalim/act-backstage@3.0.0
  - @lukekaalim/act-web@4.0.0
  - @lukekaalim/act-recon@3.0.0
  - @lukekaalim/act@4.0.0

## 6.3.0-alpha.0

### Minor Changes

- b3f6c49: Added debug capabilities and protocol

### Patch Changes

- Updated dependencies [b3f6c49]
  - @lukekaalim/act-backstage@3.0.0-alpha.0
  - @lukekaalim/act-recon@3.0.0-alpha.0
  - @lukekaalim/act-web@3.4.0-alpha.0

## 6.2.0

### Minor Changes

- Scheduling refactor

### Patch Changes

- Updated dependencies
  - @lukekaalim/act-backstage@2.0.0
  - @lukekaalim/act-recon@2.0.0
  - @lukekaalim/act-web@3.3.0

## 6.1.0

### Minor Changes

- 4381035: Added error boundaries

### Patch Changes

- Updated dependencies [4381035]
  - @lukekaalim/act-backstage@1.2.0
  - @lukekaalim/act-web@3.2.0
  - @lukekaalim/act-recon@1.1.0
  - @lukekaalim/act@3.1.0
