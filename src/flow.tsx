import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  Node,
  NodeProps,
  ReactFlow,
  reconnectEdge,
  Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
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

export const svgContext = React.createContext({
  svg: "",
  parameters: "",
});

let savedEditorData: any;

try {
  savedEditorData = JSON.parse(
    localStorage.getItem("saved-editor-data") ?? "{}"
  );
} catch {}

type Settings = {
  backgroundColor?: string;
};

function Flow() {
  const [nodes, setNodes] = useState(savedEditorData.nodes ?? initialNodes);
  const [edges, setEdges] = useState(savedEditorData.edges ?? initialEdges);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

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

  const [svgTemplate, setSvgTemplate] = useState(
    savedEditorData.svgTemplate ??
      `<svg 
  xmlns="http://www.w3.org/2000/svg" 
  xmlns:xlink="http://www.w3.org/1999/xlink" 
  viewBox="0 0 100 100"
>
  <filter id="f@FILTER_ID">
    @FILTER_SOURCE
  </filter>
  <g filter="url('#f@FILTER_ID')">
    <rect x="0" y="0" width="100%" height="100%" fill="transparent"></rect>
    <text x="50" y="50">Test</text> 
  </g>
</svg>`
  );

  const [parameters, setParameters] = useState(
    savedEditorData.parameters ?? ""
  );
  const [configuration, setConfiguration] = useState("");

  const [settings, setSettings] = useState<Settings>({});

  const [submenuType, setSubmenuType] = useState<
    "svg" | "parameters" | "import-export" | "settings"
  >("svg");

  let submenu = <></>;

  if (submenuType === "svg") {
    submenu = (
      <textarea
        id="svg-template"
        className="fullsize"
        value={svgTemplate}
        onInput={(e) => {
          setSvgTemplate(e.currentTarget.value);
        }}
      ></textarea>
    );
  } else if (submenuType === "parameters") {
    submenu = (
      <textarea
        className="fullsize"
        id="parameters"
        value={parameters}
        onInput={(e) => {
          setParameters(e.currentTarget.value);
        }}
      ></textarea>
    );
  } else if (submenuType === "import-export") {
    submenu = (
      <>
        <p>Copy/Paste Configuration Here</p>
        <textarea
          value={configuration}
          onInput={(e) => {
            setConfiguration(e.currentTarget.value);
          }}
        ></textarea>
        <br />
        <button
          onClick={() => {
            const config = JSON.parse(configuration);
            setNodes(config.nodes);
            setEdges(config.edges);
            setSvgTemplate(config.svgTemplate);
            setParameters(config.parameters);
          }}
        >
          Import Configuration
        </button>
        <button
          onClick={() => {
            setConfiguration(
              JSON.stringify({
                nodes,
                edges,
                svgTemplate,
                parameters,
              })
            );
          }}
        >
          Export Configuration
        </button>
      </>
    );
  } else if (submenuType === "settings") {
    submenu = (
      <>
        <label>Background Color</label>
        <input
          type="color"
          value={settings.backgroundColor ?? "#ffffff"}
          onInput={(e) => {
            setSettings({
              ...settings,
              backgroundColor: e.currentTarget.value,
            });
          }}
        ></input>
      </>
    );
  }

  useEffect(() => {
    localStorage.setItem(
      "saved-editor-data",
      JSON.stringify({
        nodes,
        edges,
        parameters,
        svgTemplate,
      })
    );
  }, [nodes, edges, parameters, svgTemplate]);

  return (
    <svgContext.Provider value={{ svg: svgTemplate, parameters }}>
      <ReactFlow
        style={{ backgroundColor: settings.backgroundColor ?? "white" }}
        viewport={viewport}
        onViewportChange={setViewport}
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
              position: {
                x: -viewport.x / viewport.zoom,
                y: -viewport.y / viewport.zoom,
              },
            },
          ]);
        }}
      >
        Add Filter
      </button>
      <div id="settings-menu">
        <div id="tabs">
          <button onClick={() => setSubmenuType("svg")}>SVG Template</button>
          <button onClick={() => setSubmenuType("parameters")}>
            Custom Parameters
          </button>
          <button onClick={() => setSubmenuType("settings")}>Settings</button>
          <button onClick={() => setSubmenuType("import-export")}>
            Save/Load
          </button>
        </div>
        <div id="submenu">{submenu}</div>
      </div>
    </svgContext.Provider>
  );
}

export default Flow;
