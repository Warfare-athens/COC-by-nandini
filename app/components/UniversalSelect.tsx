"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./UniversalSelect.module.css";

type UniversalSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & {
  controlSize?: "default" | "compact";
  fluid?: boolean;
};

type SelectOption = {
  disabled: boolean;
  label: string;
  value: string;
};

export default function UniversalSelect({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className = "",
  controlSize = "default",
  defaultValue,
  disabled = false,
  fluid = true,
  onChange,
  value,
  children,
  ...selectProps
}: UniversalSelectProps) {
  const generatedId = useId();
  const selectId = selectProps.id || `universal-select-${generatedId.replace(/:/g, "")}`;
  const nativeRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const options = Children.toArray(children).flatMap((child): SelectOption[] => {
    if (!isValidElement(child) || child.type !== "option") return [];
    const option = child as ReactElement<{ children?: ReactNode; disabled?: boolean; value?: string | number }>;
    const label = Children.toArray(option.props.children).join("");
    return [{
      disabled: Boolean(option.props.disabled),
      label,
      value: String(option.props.value ?? label),
    }];
  });
  const firstEnabled = options.find((option) => !option.disabled)?.value || "";
  const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? firstEnabled));
  const [open, setOpen] = useState(false);
  const selectedValue = String(value ?? uncontrolledValue);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedOption = options.find((option) => option.value === selectedValue) || options[0];

  const rootClassName = [
    styles.root,
    fluid ? styles.fluid : styles.auto,
    controlSize === "compact" ? styles.compact : "",
    open ? styles.isOpen : "",
  ].filter(Boolean).join(" ");

  const openList = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const closeList = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const choose = (nextValue: string) => {
    const option = options.find((item) => item.value === nextValue);
    if (!option || option.disabled) return;
    if (value === undefined) setUncontrolledValue(nextValue);
    const native = nativeRef.current;
    if (native) {
      native.value = nextValue;
      native.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeList(true);
  };

  const move = (direction: 1 | -1) => {
    if (!options.length) return;
    let next = activeIndex;
    for (let count = 0; count < options.length; count += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openList();
      else move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      const first = options.findIndex((option) => !option.disabled);
      if (first >= 0) setActiveIndex(first);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      const last = options.findLastIndex((option) => !option.disabled);
      if (last >= 0) setActiveIndex(last);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(options[activeIndex]?.value);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeList();
    }
  };

  return (
    <span
      className={rootClassName}
      data-universal-select
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeList();
      }}
    >
      <select
        {...selectProps}
        aria-hidden="true"
        className={styles.native}
        disabled={disabled}
        id={selectId}
        onChange={onChange || (() => undefined)}
        ref={nativeRef}
        tabIndex={-1}
        value={selectedValue}
      >
        {children}
      </select>
      <button
        aria-controls={`${selectId}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={[styles.trigger, className].filter(Boolean).join(" ")}
        disabled={disabled}
        onClick={() => open ? closeList() : openList()}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        type="button"
      >
        <span className={styles.value}>{selectedOption?.label || "Select"}</span>
        <ChevronDown className={styles.icon} size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && (
        <span className={styles.menu} id={`${selectId}-listbox`} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              aria-selected={option.value === selectedValue}
              className={[
                styles.option,
                option.value === selectedValue ? styles.selected : "",
                index === activeIndex ? styles.active : "",
              ].filter(Boolean).join(" ")}
              disabled={option.disabled}
              key={`${option.value}-${index}`}
              onClick={() => choose(option.value)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <Check size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
