import type { SlashMenuItem } from "./items";

const ROW_CLASS =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground";
const ICON_CLASS = "h-4 w-4 shrink-0";
const EMPTY_CLASS = "px-2 py-1.5 text-sm text-muted-foreground";

export function SlashMenuList({
  items,
  activeIndex,
  onSelect,
  onPointerEnter,
}: {
  items: SlashMenuItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPointerEnter: (index: number) => void;
}) {
  if (items.length === 0) {
    return <div className={EMPTY_CLASS}>No results</div>;
  }
  return (
    <>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            data-active={index === activeIndex ? "true" : "false"}
            className={ROW_CLASS}
            onPointerEnter={() => onPointerEnter(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(index);
            }}
          >
            <Icon className={ICON_CLASS} />
            <span>{item.title}</span>
          </button>
        );
      })}
    </>
  );
}
