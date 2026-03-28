import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import { InputNode, ResultNode } from "./FlowNodes";
import { requestAiResponse, saveFlowRun } from "./flowApi";
import { useQuery } from "./useQuery";

const NOOP_PROMPT_CHANGE: (value: string) => void = () => {};

function App() {
  const [status, setStatus] = useState("Idle");
  const [isSaving, setIsSaving] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");
  const [runKey, setRunKey] = useState(0);
  const STATUS_CLEAR_TIMEOUT_MS = 4500;
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
        prompt: "What is the capital of India?",
        onChange: NOOP_PROMPT_CHANGE,
      },
    },
    {
      id: "result-node",
      type: "resultNode",
      position: { x: 520, y: 120 },
      data: {
        result: "",
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

  const updatePromptNode = useCallback((value: string) => {
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

  const updateResultNode = useCallback((value: string) => {
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

  const prompt =
    (
      nodes.find((node) => node.id === "prompt-node")?.data as {
        prompt?: string;
      }
    )?.prompt || "";

  const result =
    (
      nodes.find((node) => node.id === "result-node")?.data as {
        result?: string;
      }
    )?.result || "";

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

  const fetchAiResponse = useCallback(
    () => requestAiResponse(apiBaseUrl, activePrompt),
    [activePrompt, apiBaseUrl],
  );

  const {
    data: aiAnswer,
    isLoading,
    isError,
    errorMessage,
  } = useQuery<string>({
    queryKey: [activePrompt, runKey],
    queryFn: fetchAiResponse,
    initialData: "",
    enabled: runKey > 0 && Boolean(activePrompt),
  });

  const runFlow = () => {
    if (!prompt.trim()) {
      setStatus("Please enter a prompt before running.");
      return;
    }

    setStatus("Running flow...");
    setActivePrompt(prompt.trim());
    setRunKey((current) => current + 1);
  };

  const saveFlow = async () => {
    if (!prompt.trim() || !result.trim()) {
      setStatus("Run the flow first so prompt and response can be saved.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving to MongoDB...");

    try {
      const savedId = await saveFlowRun(apiBaseUrl, prompt, result);
      setStatus(`Saved successfully. Record ID: ${savedId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save flow.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  const nodesWithHandlers = nodes.map((node) =>
    node.id === "prompt-node"
      ? {
          ...node,
          data: {
            ...node.data,
            onChange: updatePromptNode,
          },
        }
      : node,
  );

  useEffect(() => {
    if (!aiAnswer) {
      return;
    }

    updateResultNode(aiAnswer);
    setStatus("Flow completed.");
  }, [aiAnswer, updateResultNode]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    setStatus(errorMessage || "Failed to run flow.");
  }, [errorMessage, isError]);

  useEffect(() => {
    const shouldAutoClear =
      Boolean(status) &&
      status !== "Idle" &&
      status !== "Running flow..." &&
      status !== "Saving to MongoDB...";

    if (!shouldAutoClear) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus("");
    }, STATUS_CLEAR_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1> AI humorous bot </h1>
        <p>
          Its Futureblink demo app. Type in the input node, run the flow to get
          a humorous AI response, and store the result in MongoDB.
        </p>
      </header>

      <section className="toolbar">
        <button type="button" onClick={runFlow} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Flow"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={saveFlow}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <span className="status">{status}</span>
      </section>

      <section className="flow-wrap">
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodesWithHandlers}
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
