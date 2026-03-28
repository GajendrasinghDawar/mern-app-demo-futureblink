import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

type InputNodeData = {
  prompt: string;
  onChange: (value: string) => void;
};

type ResultNodeData = {
  result: string;
};

type AskAiResponse = {
  answer?: string;
  error?: string;
};

type SaveFlowResponse = {
  id?: string;
  error?: string;
};

const InputNode = ({ data }: NodeProps<Node<InputNodeData>>) => {
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

const ResultNode = ({ data }: NodeProps<Node<ResultNodeData>>) => {
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

function App() {
  const [prompt, setPrompt] = useState("What is the capital of France?");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Idle");
  const [isLoading, setIsLoading] = useState(false);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      inputNode: InputNode,
      resultNode: ResultNode,
    }),
    [],
  );

  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "prompt-node",
      type: "inputNode",
      position: { x: 80, y: 120 },
      data: {
        prompt,
        onChange: setPrompt,
      },
    },
    {
      id: "result-node",
      type: "resultNode",
      position: { x: 520, y: 120 },
      data: {
        result,
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    {
      id: "edge-prompt-result",
      source: "prompt-node",
      target: "result-node",
      animated: true,
      style: { strokeWidth: 2 },
    },
  ]);

  const syncPromptNode = useCallback((value: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === "prompt-node"
          ? {
              ...node,
              data: { ...node.data, prompt: value },
            }
          : node,
      ),
    );
  }, []);

  const syncResultNode = useCallback((value: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === "result-node"
          ? {
              ...node,
              data: { ...node.data, result: value },
            }
          : node,
      ),
    );
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges)),
    [],
  );

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const runFlow = async () => {
    if (!prompt.trim()) {
      setStatus("Please enter a prompt before running.");
      return;
    }

    setIsLoading(true);
    setStatus("Running flow...");

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as AskAiResponse;

      if (!response.ok || !data.answer) {
        throw new Error(data.error || "Request failed.");
      }

      setResult(data.answer);
      syncResultNode(data.answer);
      setStatus("Flow completed.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to run flow.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFlow = async () => {
    if (!prompt.trim() || !result.trim()) {
      setStatus("Run the flow first so prompt and response can be saved.");
      return;
    }

    setStatus("Saving to MongoDB...");

    try {
      const response = await fetch(`${apiBaseUrl}/api/flows/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, response: result }),
      });

      const data = (await response.json()) as SaveFlowResponse;

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Save failed.");
      }

      setStatus(`Saved successfully. Record ID: ${data.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save flow.";
      setStatus(message);
    }
  };

  useEffect(() => {
    syncPromptNode(prompt);
  }, [prompt, syncPromptNode]);

  useEffect(() => {
    syncResultNode(result);
  }, [result, syncResultNode]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>AI Prompt Flow</h1>
        <p>
          Type in the input node, run the flow, and store the result in MongoDB.
        </p>
      </header>

      <section className="toolbar">
        <button type="button" onClick={runFlow} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Flow"}
        </button>
        <button type="button" className="ghost" onClick={saveFlow}>
          Save
        </button>
        <span className="status">{status}</span>
      </section>

      <section className="flow-wrap">
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            minZoom={0.6}
            maxZoom={1.5}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}

export default App;
