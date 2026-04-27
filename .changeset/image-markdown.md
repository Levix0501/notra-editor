---
'notra-editor': minor
---

Add Markdown image syntax support. The standard `![alt](url "title")` syntax is now parsed and rendered as a block-level `<img>` in both `NotraEditor` and `NotraReader`. A new `ImagePopover` toolbar component lets users insert/edit/remove images via a small popover with URL and Alt inputs (mirrors `LinkPopover`). Images are styled with a max-width of 100%, rounded corners, and a brand-color outline when selected. Image upload is intentionally not included in this release.
