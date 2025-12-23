---
"@lukekaalim/act-web": patch
"@lukekaalim/act-recon": patch
---

Reconciler should apply all changes in the correct order, and not skip any.
 - Reconciler does send out a Render command once it completes all pending renders (called a "ThreadStack")
Scheduler has been updated to perform some updates in Sync.
