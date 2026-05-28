import StarterKit from "@tiptap/starter-kit";

export function buildStarterKit() {
  return StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    horizontalRule: false,
    link: false,
  });
}
