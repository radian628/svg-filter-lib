import { Edge, Node } from "@xyflow/react";
import { FilterType } from "./GenericFilterNode";

export function getInputs(edges: Edge[], nodeId: string) {
  const inputs = Array.from(new Set(edges.filter((e) => e.target === nodeId)));

  if (inputs.length == 2 && inputs[0].targetHandle === "in2") {
    return [inputs[1].source, inputs[0].source];
  }
  return inputs.map((i) => i.source);
}

function getInputId(
  nodeId: string,
  nodes: Node<{ filter: any; filterType: FilterType }, string>[]
) {
  const node = nodes.find((n) => n.id === nodeId)!;

  if (node.data.filterType === "source") {
    return "SourceGraphic";
  }
  return node.id;
}

export function generateSingleSvgFilter(
  nodes: Node<{ filter: any; filterType: FilterType }, string>[],
  edges: Edge[],
  nodeId: string
) {
  const inputs = getInputs(edges, nodeId);
  const node = nodes.find((n) => n.id === nodeId)!;
  const filter = node.data.filter;

  return `<${filter._overrideId ?? filter.node} result="${nodeId}" ${
    inputs[0] ? `in="${getInputId(inputs[0], nodes)}"` : ""
  } ${
    inputs[1] ? `in2="${getInputId(inputs[1], nodes)}"` : ""
  } ${Object.entries(filter)
    .map(([k, v]) => {
      if (k === "node") return "";
      if (k === "_overrideId") return "";
      return `${k}="${v}"`;
    })
    .join(" ")}/>`;
}

export function generateSvgFilter(
  nodes: Node<{ filter: any; filterType: FilterType }, string>[],
  edges: Edge[],
  visited: Set<string>,
  nodeId: string
) {
  let outstr = "";

  if (visited.has(nodeId)) return outstr;

  const inputs = getInputs(edges, nodeId);

  for (const i of inputs) {
    outstr += generateSvgFilter(nodes, edges, visited, i);
  }

  outstr += generateSingleSvgFilter(nodes, edges, nodeId);

  return outstr;
}
