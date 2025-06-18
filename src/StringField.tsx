import { FF } from "./lib";
import React from "react";

export function StringField(props: {
  label: string;
  field: string;
  filter: FF;
  updateFilter: (ff: FF) => void;
  textarea?: boolean;
}) {
  return (
    <div style={{ display: "flex", width: "100%", fontSize: "60%" }}>
      <label>{props.label}&nbsp;</label>
      {props.textarea ? (
        <textarea
          style={{ width: "100%", height: "80px" }}
          value={props.filter[props.field]?.toString() ?? ""}
          onInput={(e) => {
            props.updateFilter({
              ...props.filter,
              [props.field]: e.currentTarget.value,
            });
          }}
        ></textarea>
      ) : (
        <input
          style={{ width: "100%", fontSize: "60%" }}
          value={props.filter[props.field]?.toString() ?? ""}
          onInput={(e) => {
            props.updateFilter({
              ...props.filter,
              [props.field]: e.currentTarget.value,
            });
          }}
        ></input>
      )}
    </div>
  );
}

export function FieldSet(props: {
  filter: FF;
  updateFilter: (ff: FF) => void;
  fields: ([string, string] | [string, string, { textarea?: boolean }])[];
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
        ></StringField>
      ))}
    </>
  );
}
