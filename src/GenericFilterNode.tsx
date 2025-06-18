import {
  Handle,
  Node,
  NodeProps,
  Position,
  useNodesData,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { FF, makeCSSFilter } from "./lib";
import { generateSvgFilter } from "./generate-svg";
import { FieldSet, StringField } from "./StringField";
import "./GenericFilterNode.css";
import { svgContext } from "./flow";

function isValidJSON(x: any) {
  try {
    JSON.parse(x);
    return true;
  } catch {
    return false;
  }
}

type FilterType =
  | "json"
  | "feGaussianBlur"
  | "feTurbulence"
  | "feColorMatrix"
  | "feDisplacementMap"
  | "feBlend"
  | "feComposite"
  | "feConvolveMatrix";

export type GenericFilterNodeType = Node<
  { filter: FF; filterType: FilterType },
  "filter"
>;
let filtercounter = 0;

export default function GenericFilterNode(
  props: NodeProps<GenericFilterNodeType>
) {
  const updateNodeInternals = useUpdateNodeInternals();
  const rf = useReactFlow<GenericFilterNodeType>();
  useNodesData(rf.getNodes().map((n) => n.id));

  const svg = useContext(svgContext);

  const nodes = rf.getNodes();
  const edges = rf.getEdges();

  const { updateNodeData } = rf;
  const [data, setData] = useState(JSON.stringify(props.data.filter, null, 2));

  const svgRef = useRef<HTMLDivElement>(null);
  const localFilterId = useRef<number>(filtercounter);

  useEffect(() => {
    const filter = generateSvgFilter(nodes, edges, new Set(), props.id);

    filtercounter++;

    if (svgRef.current) {
      // svgRef.current.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" >
      // <filter id="f${filtercounter}">${filter}</filter><rect fill="white" width="100%" height="100%" filter="url('#f${filtercounter}')"></rect></svg>`;
      localFilterId.current = filtercounter;
      svgRef.current.innerHTML = svg
        .replaceAll("@FILTER_ID", filtercounter.toString())
        .replaceAll("@FILTER_SOURCE", filter);
    }
  }, [nodes, edges]);

  useEffect(() => {
    updateNodeInternals(props.id);
  }, [updateNodeInternals, props.data.filterType]);

  let inputCount: number;

  let interactable = (
    <textarea
      style={{
        border: isValidJSON(data) ? "none" : "1px solid red",
        resize: "none",
        fontSize: "70%",
        background: "none",
        width: "100%",
        height: "100%",
        color: "white",
        textShadow: "0 0 4px black",
      }}
      value={data}
      onInput={(e) => {
        setData(e.currentTarget.value);
        if (isValidJSON(e.currentTarget.value)) {
          updateNodeData(props.id, {
            filter: JSON.parse(e.currentTarget.value),
          });
        }
      }}
    ></textarea>
  );

  function updateFilter(ff: FF) {
    updateNodeData(props.id, {
      filter: ff,
    });
  }

  function updateFilterType(type: FilterType) {
    updateNodeData(
      props.id,
      {
        filterType: type,
        filter: {
          node: type === "json" ? "feFlood" : type,
        },
      },
      { replace: true }
    );
  }

  const filter = props.data.filter;

  if (props.data.filterType === "feGaussianBlur") {
    inputCount = 1;
    interactable = (
      <StringField
        label="Stdev"
        field="stdDeviation"
        filter={filter}
        updateFilter={updateFilter}
      ></StringField>
    );
  } else if (props.data.filterType === "feTurbulence") {
    inputCount = 0;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["baseFrequency", "Freq"],
          ["numOctaves", "Octaves"],
          ["seed", "Seed"],
          ["stitchTiles", "Stitch"],
          ["type", "Type"],
        ]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "feColorMatrix") {
    inputCount = 1;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["values", "", { textarea: true }],
          ["type", "Type"],
        ]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "feDisplacementMap") {
    inputCount = 2;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["scale", "Scale"],
          ["xChannelSelector", "X Channel"],
          ["yChannelSelector", "Y Channel"],
        ]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "feBlend") {
    inputCount = 2;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[["mode", "Mode"]]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "feComposite") {
    inputCount = 2;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["operator", "Mode"],
          ["k1", "K1"],
          ["k2", "K2"],
          ["k3", "K3"],
          ["k4", "K4"],
        ]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "feConvolveMatrix") {
    inputCount = 1;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["kernelMatrix", "", { textarea: true }],
          ["order", "Order"],
          ["divisor", "Divisor"],
          ["bias", "Bias"],
          ["targetX", "Target X"],
          ["targetY", "Target Y"],
          ["edgeMode", "Edge Mode"],
          ["kernelUnitLength", "Kernel Unit Len"],
          ["preserveAlpha", "Preserve Alpha"],
        ]}
      ></FieldSet>
    );
  } else {
    inputCount = 2;
  }

  return (
    <div className="generic-filter-node">
      <div className="svg-container" ref={svgRef}></div>
      <div className="interactable-container">
        <div className="copy-buttons">
          <button
            onClick={() => {
              navigator.clipboard.writeText(svgRef.current?.innerHTML ?? "");
            }}
          >
            Copy SVG
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `data:image/svg+xml,${encodeURIComponent(
                  svgRef.current?.innerHTML ?? ""
                )}#f${localFilterId.current}`
              );
            }}
          >
            Copy URI
          </button>
        </div>
        <select
          className="nodrag"
          value={props.data.filterType}
          onChange={(e) => {
            updateFilterType(e.currentTarget.value as FilterType);
          }}
        >
          <option value="json">JSON</option>
          <option value="feGaussianBlur">Blur</option>
          <option value="feTurbulence">Noise</option>
          <option value="feColorMatrix">Matrix</option>
          <option value="feDisplacementMap">Displace</option>
          <option value="feBlend">Blend</option>
          <option value="feComposite">Composite</option>
          <option value="feConvolveMatrix">Convolve</option>
        </select>
        {interactable}
      </div>
      {inputCount >= 1 ? (
        <Handle
          style={{ top: "30px" }}
          id="in1"
          type="target"
          position={Position.Left}
        ></Handle>
      ) : (
        <></>
      )}
      {inputCount >= 2 ? (
        <Handle id="in2" type="target" position={Position.Left}></Handle>
      ) : (
        <></>
      )}
      <Handle id="out" type="source" position={Position.Right}></Handle>
    </div>
  );
}
