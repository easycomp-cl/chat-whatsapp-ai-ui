"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import type { TextSelection } from "@/features/conversations/components/compose-format-toolbar";

type WhatsAppComposeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: TextSelection | null) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  resetKey?: string;
};

const MAX_ROWS = 5;
const MIN_HEIGHT_PX = 42;

const INPUT_CLASS =
  "block w-full resize-none border-0 bg-transparent px-0 py-2 text-sm leading-relaxed text-[#111b21] shadow-none outline-none ring-0 placeholder:text-[#667781] appearance-none disabled:opacity-60 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [scrollbar-width:thin] [scrollbar-color:#c5cdd3_transparent]";

export const WhatsAppComposeInput = forwardRef<
  HTMLTextAreaElement,
  WhatsAppComposeInputProps
>(function WhatsAppComposeInput(
  {
    value,
    onChange,
    onSelectionChange,
    onKeyDown,
    disabled = false,
    placeholder = "Escribe un mensaje",
    resetKey,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const padding =
      Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * MAX_ROWS + padding;
    const nextHeight = Math.max(
      MIN_HEIGHT_PX,
      Math.min(textarea.scrollHeight, maxHeight)
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const updateSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    if (start === end) {
      onSelectionChange?.(null);
      return;
    }

    onSelectionChange?.({ start, end });
  }, [onSelectionChange]);

  useLayoutEffect(() => {
    syncHeight();
  }, [value, syncHeight, resetKey]);

  function handleBlur() {
    blurTimeoutRef.current = window.setTimeout(() => {
      onSelectionChange?.(null);
    }, 150);
  }

  function handleFocus() {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  return (
    <textarea
      ref={textareaRef}
      key={resetKey}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onKeyUp={updateSelection}
      onMouseUp={updateSelection}
      onSelect={updateSelection}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled}
      rows={1}
      placeholder={placeholder}
      spellCheck={false}
      className={INPUT_CLASS}
      style={{ minHeight: MIN_HEIGHT_PX }}
    />
  );
});
