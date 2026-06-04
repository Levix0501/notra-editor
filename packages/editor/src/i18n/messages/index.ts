import { en, type Messages } from "./en";
import { zh } from "./zh";

export { en } from "./en";
export { zh } from "./zh";
export type { MessageKey, Messages } from "./en";

export const builtinCatalogs: Record<string, Messages> = { en, zh };
