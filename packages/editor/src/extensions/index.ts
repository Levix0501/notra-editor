import type { Extensions } from "@tiptap/core";
import { buildLink } from "./link";
import { buildPlaceholder } from "./placeholder";
import { buildStarterKit } from "./starter-kit";

export type BuildDefaultExtensionsOptions = {
  placeholder?: string;
  userExtensions?: Extensions;
};

export function buildDefaultExtensions(
  options: BuildDefaultExtensionsOptions = {},
): Extensions {
  return [
    buildStarterKit(),
    buildLink(),
    buildPlaceholder(options.placeholder ?? "Write something..."),
    ...(options.userExtensions ?? []),
  ];
}
