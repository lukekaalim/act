---
"@lukekaalim/act-three": patch
---

Fix issue with act-three always settings geometry and materials to props, even if left to undefined (resulting in geo/mats being set to undefined even if they exist)
