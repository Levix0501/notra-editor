---
'notra-editor': minor
---

Remove the legacy `ui-primitive/` directory; toolbar internals now exclusively use the shadcn-style `ui/` primitives.

**Breaking**

- The `DropdownMenu` and `DropdownMenuProps` public exports (the hand-rolled portal-based dropdown from the early toolbar) have been removed. Consumers building custom toolbar items should compose `radix-ui` directly or copy the `ui/dropdown-menu` primitive into their app.

**Internal**

- `Spacer` moved from `components/ui-primitive/spacer` to `components/ui/spacer`; the `Spacer` public export from `notra-editor` is unchanged.
