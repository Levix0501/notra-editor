# notra-editor

A block-based rich text editor for React with a Notion-style editing experience and the default
shadcn/ui look, built on Tiptap 3, shadcn/ui (Base UI) and Tailwind CSS 4. See the
[package README](./packages/editor/README.md) for installation and usage.

## Repository structure

```text
notra-editor/
├── apps/
│   └── playground/      # Vite + shadcn/ui app to develop and try the editor
├── packages/
│   └── editor/          # The `notra-editor` npm package
├── .changeset/          # Release notes (Changesets)
├── biome.json           # Linter and formatter
├── turbo.json           # Task pipeline
└── pnpm-workspace.yaml
```

## Tech stack

| Area            | Tools                                                        |
| --------------- | ------------------------------------------------------------ |
| Editor engine   | Tiptap 3, ProseMirror                                        |
| UI              | React 19, shadcn/ui (Base UI), lucide icons                  |
| Styling         | Tailwind CSS 4 (prefixed, precompiled), CSS variables        |
| Language        | TypeScript 7                                                 |
| Build           | tsdown (Rolldown) for the library, Vite 8 for the playground |
| Testing         | Vitest 5, Testing Library, jsdom                             |
| Lint and format | Biome                                                        |
| Monorepo        | pnpm workspaces, Turborepo                                   |
| Releases        | Changesets, publint                                          |

## Development

Requirements: Node.js 22.18 or newer (24 LTS recommended) and pnpm 12.

```bash
npm install --global pnpm@12   # if pnpm 12 is not installed yet
pnpm install
pnpm dev                       # playground on http://localhost:5173
```

> pnpm 12 ships as a native executable. Version managers that predate it (for example
> Corepack 0.34 bundled with Node.js 24) cannot switch to it automatically yet, so install it
> globally with npm or with the [standalone installer](https://pnpm.io/installation).

| Command          | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `pnpm dev`       | Starts the playground with hot reloading.             |
| `pnpm build`     | Builds the package and the playground.                |
| `pnpm test`      | Runs the unit tests.                                  |
| `pnpm typecheck` | Type-checks all projects.                             |
| `pnpm lint`      | Lints and checks formatting (`pnpm lint:fix` to fix). |
| `pnpm check`     | Runs lint, type-check, tests and build, like CI does. |

During development the playground consumes the editor straight from its TypeScript sources
through the `@notra/source` export condition. Production builds of the playground use the
built `dist` output, exactly like an application installing the package from npm.

### Conventions

- **Styles**: Tailwind utilities in the editor must use the `nt:` prefix (for example
  `nt:flex nt:gap-2`), design tokens are `--notra-*` CSS variables. This keeps the
  precompiled stylesheet from conflicting with host applications.
- **UI components**: build the UI from shadcn/ui components (default `base-nova` style) and Lucide
  icons rather than custom widgets. Add components from `packages/editor` with
  `pnpm exec shadcn add <component>`; the CLI applies the prefix automatically. Portaled
  components read `useNotraPortal()` so that menus receive the editor scope and theme.
- **CSS variables in class names**: the stylesheet does not define the global shadcn/ui variables,
  so replace `var(--radius-md)` or `var(--foreground)` in generated class names with
  `--theme(--radius-md)` or `--theme(--color-foreground)`. A unit test checks this.
- **Imports**: internal modules are imported through the `#` subpath imports defined in
  `packages/editor/package.json`, for example `import { useNotraPortal } from "#lib/portal.tsx"`.
- **Language**: code, comments, commit messages and documentation are written in English.

## Releasing

Releases are automated with Changesets and the [Release workflow](./.github/workflows/release.yml):

1. Add a changeset to every pull request that changes the package: `pnpm changeset`.
2. When changesets reach `main`, the workflow opens or updates the release pull request
   (`chore: release notra-editor`), which bumps the version and updates the changelog.
3. Merging the release pull request runs `pnpm check` and publishes the package to npm with
   [trusted publishing](https://docs.npmjs.com/trusted-publishers) and provenance. The workflow
   also pushes the git tag and creates the GitHub release.

While `.changeset/pre.json` exists (Changesets pre mode), releases are prereleases such as
`3.0.0-canary.1` and are published under the pre mode tag (`canary`). Until the first stable
release, the workflow also points `latest` to the new prerelease. Run `pnpm changeset pre exit` in
a pull request to release a stable version.

The npm package trusts the `release.yml` workflow of this repository to publish and to manage
dist-tags, so renaming the file requires updating the trusted publisher in the package settings
on npm.

## License

[MIT](./LICENSE)
