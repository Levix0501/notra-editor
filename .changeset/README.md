# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

Every pull request that changes the published `notra-editor` package should
include a changeset describing the change for the changelog:

```bash
pnpm changeset
```

When changesets reach `main`, the Release workflow opens a release pull request
that consumes them, bumps the version and updates `CHANGELOG.md`. Merging that
pull request publishes the package to npm.
