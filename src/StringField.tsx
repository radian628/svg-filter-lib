import { FF } from "./lib";
import React, { useState } from "react";

export function StringField(props: {
  label: string;
  field: string;
  filter: FF;
  updateFilter: (ff: FF) => void;
  textarea?: boolean;
  fontSize?: number;
}) {
  const fontSize = props.fontSize
    ? `${(props.fontSize * 100).toString()}%`
    : `60%`;

  const [selectStart, setSelectStart] = useState(0);
  const [selectEnd, setSelectEnd] = useState(0);

  function updateFilter(v: string) {
    props.updateFilter({
      ...props.filter,
      [props.field]: v,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
      }}
    >
      <label style={{ fontSize }}>{props.label}&nbsp;</label>
      {props.textarea ? (
        <textarea
          ref={(e) => {
            if (e) {
              e.selectionStart = selectStart;
              e.selectionEnd = selectEnd;
            }
          }}
          onSelect={(e) => {
            setSelectStart(e.currentTarget.selectionStart);
            setSelectEnd(e.currentTarget.selectionEnd);
          }}
          style={{
            width: "100%",
            height: "80px",
            fontSize,
          }}
          value={props.filter[props.field]?.toString() ?? ""}
          onInput={(e) => {
            updateFilter(e.currentTarget.value);
            setSelectStart(e.currentTarget.selectionStart);
            setSelectEnd(e.currentTarget.selectionEnd);
          }}
        ></textarea>
      ) : (
        <input
          ref={(e) => {
            if (e) {
              e.selectionStart = selectStart;
              e.selectionEnd = selectEnd;
            }
          }}
          onSelect={(e) => {
            setSelectStart(e.currentTarget.selectionStart ?? 0);
            setSelectEnd(
              e.currentTarget.selectionEnd ??
                e.currentTarget.selectionStart ??
                0
            );
          }}
          style={{
            width: "100%",

            fontSize,
          }}
          value={props.filter[props.field]?.toString() ?? ""}
          onInput={(e) => {
            updateFilter(e.currentTarget.value);
            setSelectStart(e.currentTarget.selectionStart ?? 0);
            setSelectEnd(e.currentTarget.selectionEnd ?? 0);
          }}
        ></input>
      )}
    </div>
  );
}

export function FieldSet(props: {
  filter: FF;
  updateFilter: (ff: FF) => void;
  fields: (
    | [string, string]
    | [string, string, { textarea?: boolean; fontSize?: number }]
  )[];
}) {
  return (
    <>
      {props.fields.map(([field, label, config]) => (
        <StringField
          label={label}
          field={field}
          filter={props.filter}
          updateFilter={props.updateFilter}
          textarea={config?.textarea}
          fontSize={config?.fontSize}
          key={field}
        ></StringField>
      ))}
    </>
  );
}
