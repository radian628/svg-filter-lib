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
import {
  applyParameters,
  generateSvgFilter,
  parseParameters,
} from "./generate-svg";
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

export type FilterType =
  | "json"
  | "feGaussianBlur"
  | "feTurbulence"
  | "feColorMatrix"
  | "feDisplacementMap"
  | "feBlend"
  | "feComposite"
  | "feConvolveMatrix"
  | "source"
  | "feFlood"
  | "xml";

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

  const svgRef = useRef<HTMLCanvasElement>(null);

  function getSvg(index: number, applyReplacements: boolean) {
    const filter = generateSvgFilter(nodes, edges, new Set(), props.id);

    let svgstr = svg.svg;

    if (props.data.filterType === "source") {
      svgstr = svgstr.replaceAll("url('#f@FILTER_ID')", "");
    } else {
      svgstr = svgstr
        .replaceAll("@FILTER_ID", index.toString())
        .replaceAll("@FILTER_SOURCE", filter);
    }

    return applyReplacements ? applyParameters(svgstr, svg.parameters) : svgstr;
  }

  function getSvgFilterURI(index: number) {
    const filter = generateSvgFilter(nodes, edges, new Set(), props.id);

    const params = parseParameters(svg.parameters);

    let svgstr = svg.svg;

    if (props.data.filterType === "source") {
      svgstr = svgstr.replaceAll("url('#f@FILTER_ID')", "");
    } else {
      svgstr = svgstr
        .replaceAll("@FILTER_ID", index.toString())
        .replaceAll("@FILTER_SOURCE", filter);
    }

    for (const p of params) {
      const split = svgstr.split(p.src);
      svgstr = split.map((s) => encodeURIComponent(s)).join(p.src);
    }

    return `data:image/svg+xml;utf8,${svgstr}#f${index.toString()}`;
  }

  const normalizedSvgRef = useRef<string>("");

  useEffect(() => {
    const filter = generateSvgFilter(nodes, edges, new Set(), props.id);

    const normsvg = getSvg(0, true);
    if (svgRef.current && normalizedSvgRef.current !== normsvg) {
      normalizedSvgRef.current = normsvg;
      // svgRef.current.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" >
      // <filter id="f${filtercounter}">${filter}</filter><rect fill="white" width="100%" height="100%" filter="url('#f${filtercounter}')"></rect></svg>`;
      // svgRef.current.innerHTML = getSvg(filtercounter++, true);
      const ctx = svgRef.current.getContext("2d");
      if (!ctx) return;
      const img = document.createElement("img");
      img.addEventListener("load", () => {
        ctx.clearRect(0, 0, 450, 450);
        ctx.drawImage(img, 0, 0, 450, 450);
      });
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
        getSvg(filtercounter++, true)
      )}`;
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
        filter:
          type === "source"
            ? {
                _overrideId: "SourceGraphic",
              }
            : type === "xml"
            ? {
                value: `<feFlood @params flood-color="red">`,
              }
            : {
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
  } else if (props.data.filterType === "source") {
    inputCount = 0;
    interactable = <></>;
  } else if (props.data.filterType === "feFlood") {
    inputCount = 0;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[
          ["x", "X"],
          ["y", "Y"],
          ["width", "Width"],
          ["height", "Height"],
          ["flood-color", "Color"],
          ["flood-opacity", "Opacity"],
        ]}
      ></FieldSet>
    );
  } else if (props.data.filterType === "xml") {
    inputCount = 2;
    interactable = (
      <FieldSet
        filter={filter}
        updateFilter={updateFilter}
        fields={[["value", "", { textarea: true, fontSize: 0.5 }]]}
      ></FieldSet>
    );
  } else {
    inputCount = 2;
  }

  return (
    <div className="generic-filter-node">
      <canvas
        className="svg-container"
        width="450"
        height="450"
        ref={svgRef}
      ></canvas>
      <div className="interactable-container">
        <button
          className="delete-button"
          onClick={() => {
            rf.deleteElements({
              nodes: [props],
            });
          }}
        >
          X
        </button>
        <div className="top-bar">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getSvg(0, false));
            }}
          >
            Copy SVG
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(getSvgFilterURI(0));
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
          <option value="source">Source Image</option>
          <option value="feGaussianBlur">Blur</option>
          <option value="feTurbulence">Noise</option>
          <option value="feColorMatrix">Matrix</option>
          <option value="feDisplacementMap">Displace</option>
          <option value="feBlend">Blend</option>
          <option value="feComposite">Composite</option>
          <option value="feConvolveMatrix">Convolve</option>
          <option value="feFlood">Flood</option>
          <option value="xml">XML</option>
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
