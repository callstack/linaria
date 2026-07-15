---
'@linaria/atomic': patch
---

Include the `!important` flag in atomic class name hashing. Previously, declarations differing only in importance (e.g. `color: red` and `color: red !important` in different files) produced the same `atm_*` class name while the emitted rule bodies differed, so whichever copy of the rule was loaded applied to every user of the atom — leaking `!important` to unrelated components and defeating their inline-style and cascade overrides. The flag now participates in the value slug (not the property slug, so `cx` deduplication semantics are unchanged), giving each variant its own class.
