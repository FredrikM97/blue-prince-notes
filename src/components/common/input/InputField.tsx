/**
 * InputField — plain labeled single-line input.
 *
 * No state, no logic. For token suggestions wrap it:
 *   <SuggestionsDropdown value={v} onChange={set} ariaLabel="...">
 *     <InputField label="Title" value={v} onChange={set} />
 *   </SuggestionsDropdown>
 */

import { useId } from "react";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";

/** Plain labeled text input. Zero suggestion or key-handling logic. */
export function InputField({
  label,
  value,
  onChange,
  placeholder,
  inputClassName,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const inputId = useId();
  return (
    <>
      <label className="capture-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName ?? INPUT_BASE_CLASS}
      />
    </>
  );
}
