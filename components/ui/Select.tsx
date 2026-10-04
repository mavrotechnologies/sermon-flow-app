'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from './icons';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Quieter text beside the label in the menu — the trigger shows the label alone. */
  description?: string;
  /** Neighbouring options that share a group sit together under its heading. */
  group?: string;
}

interface SelectProps<T extends string> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Accessible name — the trigger itself shows only the current choice. */
  label: string;
  icon?: ReactNode;
  /** Trigger text while nothing is selected. */
  placeholder?: string;
  /** Menu text while there are no options. */
  emptyText?: string;
  className?: string;
  /** Extra classes for the chosen value in the trigger, e.g. a heavier weight. */
  valueClassName?: string;
}

/** A pause this long starts a fresh type-ahead search. */
const TYPEAHEAD_RESET_MS = 600;

/**
 * Dropdown in the parchment system, standing in for a native `<select>` whose open
 * menu the browser draws in its own style. Focus stays on the trigger and the
 * highlighted option is announced through `aria-activedescendant`, so it keeps the
 * native keys: arrows, Home/End, Enter or Space, Escape, and typing to jump.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  icon,
  placeholder = 'Select…',
  emptyText = 'Nothing to choose from',
  className = '',
  valueClassName = '',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const id = useId();
  const optionId = (index: number) => `${id}-option-${index}`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  // Runs of neighbouring options with the same group, each keeping its flat index.
  const sections: { heading?: string; items: { option: SelectOption<T>; index: number }[] }[] = [];
  options.forEach((option, index) => {
    const current = sections[sections.length - 1];
    if (current && current.heading === option.group) current.items.push({ option, index });
    else sections.push({ heading: option.group, items: [{ option, index }] });
  });

  // Close on a press anywhere else. Not left to blur: Safari doesn't focus a clicked button.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // A long list opens scrolled to the current choice.
  useEffect(() => {
    if (open) rootRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  const openMenu = () => {
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  /** Keyboard moves scroll the option into view; hovering never scrolls. */
  const moveTo = (index: number) => {
    setActiveIndex(index);
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openMenu();
        else moveTo(Math.min(last, Math.max(0, activeIndex + (event.key === 'ArrowDown' ? 1 : -1))));
        return;
      case 'Home':
      case 'End':
        if (!open) return;
        event.preventDefault();
        moveTo(event.key === 'Home' ? 0 : last);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(activeIndex);
        else openMenu();
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        return;
      case 'Tab':
        setOpen(false);
        return;
    }

    // Type-ahead: letters typed in quick succession jump to the option they spell.
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
    const search = typeahead.current;
    const now = Date.now();
    search.text = now - search.at > TYPEAHEAD_RESET_MS ? event.key : search.text + event.key;
    search.at = now;
    const match = options.findIndex((option) => option.label.toLowerCase().startsWith(search.text.toLowerCase()));
    if (match < 0) return;
    setOpen(true);
    moveTo(match);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        onClick={(event) => {
          event.currentTarget.focus();
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={onKeyDown}
        // Firefox clicks a button on Space's keyup even when keydown was handled.
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault();
        }}
        className={`flex h-11 w-full items-center gap-2.5 rounded-control border bg-paper pr-2.5 pl-3 text-[0.875rem] transition-all duration-200 ${
          open
            ? 'border-evergreen/50 shadow-[0_0_0_3px_rgba(31,93,76,0.10)]'
            : 'border-line hover:border-line-strong hover:bg-paper-raised'
        }`}
      >
        {icon && (
          <span className={`shrink-0 transition-colors ${open ? 'text-evergreen' : 'text-ink-muted'}`}>{icon}</span>
        )}
        <span
          className={`min-w-0 flex-1 truncate text-left ${selected ? `text-ink ${valueClassName}` : 'text-ink-muted'}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={`${id}-menu`}
          role="listbox"
          aria-label={label}
          // Keep focus on the trigger while the menu is clicked or its scrollbar dragged.
          onMouseDown={(event) => event.preventDefault()}
          className="animate-scale-in absolute top-full left-0 z-50 mt-2 grid max-h-80 w-max max-w-[min(24rem,calc(100vw-2rem))] min-w-full origin-top grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 overflow-y-auto rounded-[0.875rem] border border-line bg-paper p-1.5 shadow-lifted"
        >
          {options.length === 0 && (
            <p className="col-span-full px-2.5 py-2 text-[0.875rem] text-ink-muted">{emptyText}</p>
          )}

          {sections.map((section, sectionIndex) => {
            const headingId = `${id}-group-${sectionIndex}`;
            const items = section.items.map(({ option, index }) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={`col-span-full grid cursor-pointer grid-cols-subgrid items-center rounded-lg px-2.5 py-2 text-[0.875rem] transition-colors ${
                    index === activeIndex ? 'bg-evergreen-soft' : ''
                  }`}
                >
                  <span
                    className={`text-ink ${
                      option.description ? 'font-semibold' : `col-span-2 ${isSelected ? 'font-semibold' : 'font-medium'}`
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.description && <span className="text-ink-body">{option.description}</span>}
                  <CheckIcon className={`h-4 w-4 text-evergreen ${isSelected ? '' : 'invisible'}`} />
                </div>
              );
            });

            if (!section.heading) return items;

            return (
              <div
                key={headingId}
                role="group"
                aria-labelledby={headingId}
                className={`col-span-full grid grid-cols-subgrid ${
                  sectionIndex > 0 ? 'mt-1.5 border-t border-line pt-1.5' : ''
                }`}
              >
                <p id={headingId} className="eyebrow col-span-full px-2.5 pt-1.5 pb-1 text-[0.6875rem] text-ink-muted">
                  {section.heading}
                </p>
                {items}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
