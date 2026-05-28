import Link from "@tiptap/extension-link";

export function buildLink() {
  return Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    },
  });
}
