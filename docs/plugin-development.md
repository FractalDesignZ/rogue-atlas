# Plugin development

There is **no plugin host** in this repository yet.

When one exists, a plugin must declare:

```ts
type AtlasPlugin = {
  id: string;
  representations: Representation[];
  nulls: { name: string; domain: AdapterSource[]; justify: string }[];
  ladderMax: LadderLevel;       // cannot self-promote
  warnings: string[];
  manuscriptReported: string[]; // ids it will not pretend to recompute
};
```

Rules a future host must enforce:

1. A plugin cannot set `evidence: "validated"` without a holdout record.
2. A plugin cannot register GUE except on `zeta` / `spectra`.
3. A plugin cannot mark L0 interlocks as learned.
4. A plugin cannot skip Audit or Compare.

Until that host exists, extend the kernel by adding a domain in
`src/lib/adapter/` and a representation list in
`representationsFor`. Ship tests. Do not add a second epistemology.
