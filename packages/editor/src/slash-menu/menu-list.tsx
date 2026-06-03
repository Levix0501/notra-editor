import type { ReactNode } from "react";

import type { SlashMenuItem } from "./items";

const ROW_CLASS =
  "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground";
const ICON_CLASS = "mt-0.5 h-4 w-4 shrink-0";
const TITLE_CLASS = "text-sm";
const SUBTITLE_CLASS = "text-xs text-muted-foreground";
const GROUP_LABEL_CLASS = "px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground";

export function SlashMenuList({
  items,
  activeIndex,
  grouped = false,
  onSelect,
  onPointerEnter,
}: {
  items: SlashMenuItem[];
  activeIndex: number;
  grouped?: boolean;
  onSelect: (index: number) => void;
  onPointerEnter: (index: number) => void;
}) {
  // No matches: render nothing. The popover host (index.tsx) hides the whole box in this
  // case, so the user keeps typing as if no menu were open — no "No results" placeholder.
  if (items.length === 0) return null;

  const renderRow = (item: SlashMenuItem, index: number) => {
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
        <span className="flex flex-col">
          <span className={TITLE_CLASS}>{item.title}</span>
          {item.subtitle ? <span className={SUBTITLE_CLASS}>{item.subtitle}</span> : null}
        </span>
      </button>
    );
  };

  if (!grouped) {
    return <>{items.map((item, index) => renderRow(item, index))}</>;
  }

  const groups: { label: string; rows: ReactNode[] }[] = [];
  items.forEach((item, index) => {
    const label = item.group ?? "";
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, rows: [] };
      groups.push(group);
    }
    group.rows.push(renderRow(item, index));
  });

  return (
    <>
      {groups.map((g) => (
        <div key={g.label || "ungrouped"}>
          {g.label ? <div className={GROUP_LABEL_CLASS}>{g.label}</div> : null}
          {g.rows}
        </div>
      ))}
    </>
  );
}
