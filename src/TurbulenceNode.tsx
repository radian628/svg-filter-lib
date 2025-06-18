import { Handle, NodeProps, Position } from "@xyflow/react";
import { useState } from "react";
import React from "react";

export default function TurbulenceNode(props: NodeProps) {
  return (
    <>
      <div>Turbulence</div>
      <Handle type="source" position={Position.Right}></Handle>
    </>
  );
}
