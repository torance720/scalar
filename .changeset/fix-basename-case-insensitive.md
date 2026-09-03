---
'@scalar/helpers': patch
---

Make basename() perform case-insensitive extension comparison on Windows to correctly strip extensions like `.TS` or `.Js` on case-insensitive filesystems.
