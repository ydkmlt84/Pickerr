"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import type { FilterValue } from "../../../../types/moviematch";
import { Pill } from "../../components/atoms/Pill";
import styles from "./AutoSuggestInput.module.css";

interface AutoSuggestInputProps {
  inputName: string;
  items: FilterValue[];
  value: FilterValue[];
  onChange: (value: FilterValue[]) => void;
}

export const AutoSuggestInput = ({
  inputName,
  items,
  value,
  onChange,
}: AutoSuggestInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState<FilterValue[]>(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !selected.some((s) => s.value === item.value) &&
          item.title.toLowerCase().startsWith(inputValue.toLowerCase())
      ),
    [items, selected, inputValue]
  );

  return (
    <div className={styles.container}>
      <Combobox
        value={null}
        onChange={(item: FilterValue | null) => {
          if (item && !selected.some((s) => s.value === item.value)) {
            setSelected([...selected, item]);
            setInputValue("");
          }
        }}
      >
        <div className={styles.selections}>
          {selected.map((item, index) => (
            <React.Fragment key={`selected-item-${item.value}`}>
              {index > 0 && (
                <span className={styles.selectionsDelimiterLabel}>or</span>
              )}
              <Pill
                onRemove={(e) => {
                  e.stopPropagation();
                  setSelected((prev) =>
                    prev.filter((p) => p.value !== item.value)
                  );
                }}
              >
                {item.title}
              </Pill>
            </React.Fragment>
          ))}
          <ComboboxInput
            className={styles.input}
            name={inputName}
            onChange={(event) => setInputValue(event.target.value)}
            displayValue={() => ""}
            ref={inputRef}
            onFocus={() => setInputValue("")}
            data-test-handle={`${inputName}-autosuggest-input`}
          />
        </div>

        {filteredItems.length > 0 && (
          <ComboboxOptions className={styles.suggestions}>
            <div
              className={styles.suggestionsScrollBox}
              data-test-handle={`${inputName}-suggestions`}
            >
              {filteredItems.map((item) => (
                <ComboboxOption
                  key={item.value}
                  value={item}
                  className={({ active }) =>
                    active
                      ? styles.highlightedSuggestion
                      : styles.suggestion
                  }
                  data-test-handle={`${inputName}-suggestion-${item.title}`}
                >
                  {item.title}
                </ComboboxOption>
              ))}
            </div>
          </ComboboxOptions>
        )}
      </Combobox>
    </div>
  );
};
