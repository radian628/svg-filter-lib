import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  Node,
  NodeProps,
  ReactFlow,
  reconnectEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useRef, useState } from "react";
import React from "react";
import GaussianBlurNode from "./GaussianBlurNode";
import TurbulenceNode from "./TurbulenceNode";
import GenericFilterNode, { GenericFilterNodeType } from "./GenericFilterNode";
import { fractalNoise } from "./lib";
import { v4 } from "uuid";

const initialNodes: GenericFilterNodeType[] = [
  // {
  //   id: "1",
  //   type: "filter",
  //   data: { filter: fractalNoise(1, 1, 4, 1), filterType: "json" },
  //   position: { x: 250, y: 25 },
  // },
  // {
  //   id: "2",
  //   data: { filter: fractalNoise(1, 1, 4, 1), filterType: "json" },
  //   position: { x: 150, y: 250 },
  //   type: "filter",
  // },
  // {
  //   id: "3",
  //   data: { filter: fractalNoise(1, 1, 4, 1), filterType: "json" },
  //   position: { x: 250, y: 250 },
  //   type: "filter",
  // },
  // {
  //   id: "4",
  //   data: { filter: fractalNoise(1, 1, 4, 1), filterType: "feGaussianBlur" },
  //   position: { x: 250, y: 250 },
  //   type: "filter",
  // },
];

const initialEdges: Edge[] = [];

const nodeTypes = {
  gaussianBlur: GaussianBlurNode,
  turbulence: TurbulenceNode,
  filter: GenericFilterNode,
};

export const svgContext = React.createContext("");

function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, []);

  const onReconnectEnd = useCallback((_, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeReconnectSuccessful.current = true;
  }, []);

  const [svgTemplate, setSvgTemplate] =
    useState(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" >
  <filter id="f@FILTER_ID">@FILTER_SOURCE</filter><g filter="url('#f@FILTER_ID')">
<rect x=0 y=0 width=100% height=100% fill=transparent></rect>
 <text x=50 y=50>Test</text> 
  </g></svg>`);

  return (
    <svgContext.Provider value={svgTemplate}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        nodeTypes={nodeTypes}
        fitView
      />
      <button
        id="add-filter"
        onClick={(e) => {
          setNodes([
            ...nodes,
            {
              id: v4(),
              type: "filter",
              data: {
                filter: {},
                filterType: "source",
              },
              position: { x: 25, y: 25 },
            },
          ]);
        }}
      >
        Add Filter
      </button>
      <textarea
        id="svg-template"
        value={svgTemplate}
        onInput={(e) => {
          setSvgTemplate(e.currentTarget.value);
        }}
      ></textarea>
    </svgContext.Provider>
  );
}

export default Flow;
