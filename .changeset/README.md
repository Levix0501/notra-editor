# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

Every pull request that changes the published `notra-editor` package should
include a changeset describing the change for the changelog:

```bash
pnpm changeset
```

On release, `pnpm version-packages` consumes the changesets, bumps versions and
updates `CHANGELOG.md`; `pnpm release` builds and publishes to npm.
