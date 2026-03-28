import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { InputNodeData, ResultNodeData } from "./flowTypes";

export const InputNode = ({ data }: NodeProps<Node<InputNodeData>>) => {
  return (
    <div className="flow-node input-node">
      <div className="node-title">Prompt Input</div>
      <textarea
        className="node-textarea"
        value={data.prompt}
        onChange={(event) => data.onChange(event.target.value)}
        placeholder="Type your question..."
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export const ResultNode = ({ data }: NodeProps<Node<ResultNodeData>>) => {
  return (
    <div className="flow-node result-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">AI Result</div>
      <div className="node-result">
        {data.result || "Click Run Flow to generate a response."}
      </div>
    </div>
  );
};
