import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import React from "react";

export default function GaussianBlurNode() {
  const [stdDeviation, setStdDeviation] = useState("");

  return (
    <>
      <div>Gaussian Blur</div>
      <Handle type="target" position={Position.Left}></Handle>
      <div>
        <label>Standard Deviation</label>
        <input
          type="text"
          value={stdDeviation}
          onChange={(e) => setStdDeviation(e.currentTarget.value)}
        ></input>
      </div>
    </>
  );
}
