"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import for react-force-graph (using the AFRAME version)
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

export default function RelationshipsPage() {
  // Existing person data fetch (from /relationships/people)
  const [people, setPeople] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Graph data state
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");

  // State to track if AFRAME is loaded
  const [aframeLoaded, setAframeLoaded] = useState(false);

  // For dynamic table viewing of different node labels
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  // Load AFRAME on client-side and ensure it's available globally
  useEffect(() => {
    async function loadAframe() {
      try {
        const aframeModule = await import("aframe");
        if (!window.AFRAME) {
          window.AFRAME = aframeModule;
        }
        setAframeLoaded(true);
      } catch (err) {
        console.error("Error loading AFRAME:", err);
        setError("Error loading AFRAME");
      }
    }
    loadAframe();
  }, []);

  // Fetch a list of Person nodes separately
  useEffect(() => {
    async function fetchPeople() {
      try {
        const res = await fetch("http://localhost:8000/relationships/people");
        if (!res.ok) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.people) {
          setPeople(data.people);
        } else {
          setError("No people data returned.");
        }
      } catch (err: any) {
        console.error("Error fetching people from Neo4j:", err);
        setError(err.message);
      }
    }
    fetchPeople();
  }, []);

  // Fetch full graph data
  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch("http://localhost:8000/relationships/graph");
        if (!res.ok) {
          throw new Error(`Graph fetch error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        // Transform nodes/relationships into ForceGraph format
        const transformedNodes = data.nodes.map((n: any) => ({
          // 'label' is a simplified single-label approach:
          id: n.id,
          label: n.labels && n.labels.length > 0 ? n.labels[0] : "Node",
          ...n.properties, // flatten node properties at the top level
        }));

        const transformedLinks = data.relationships.map((r: any) => ({
          id: r.id,
          source: r.startNode,
          target: r.endNode,
          label: r.type,
          ...r.properties,
        }));

        setGraphData({ nodes: transformedNodes, links: transformedLinks });
      } catch (err: any) {
        console.error("Error fetching full graph from Neo4j:", err);
        setError(err.message);
      }
    }
    fetchGraph();
  }, []);

  // Collect unique labels from the nodes (for dynamic table selection)
  const uniqueLabels = Array.from(new Set(graphData.nodes.map((n) => n.label))).sort();

  // If no label selected yet, pick the first from the list (if any)
  useEffect(() => {
    if (!selectedLabel && uniqueLabels.length > 0) {
      setSelectedLabel(uniqueLabels[0]);
    }
  }, [uniqueLabels, selectedLabel]);

  // Filter nodes by selected label
  const nodesForSelectedLabel = graphData.nodes.filter(
    (n) => n.label === selectedLabel
  );

  // Build a set of all property keys across these nodes (excluding id & label)
  const propertyKeys = new Set<string>();
  nodesForSelectedLabel.forEach((node) => {
    Object.keys(node).forEach((k) => {
      if (k !== "id" && k !== "label") {
        propertyKeys.add(k);
      }
    });
  });
  const propertyKeysArray = Array.from(propertyKeys).sort();

  return (
    <div className="w-full bg-base-100">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Relationships</h1>
        <p className="mb-4">Explore people and their connections from Neo4j.</p>

        <div className="flex gap-2 mb-4">
          <button
            className={`btn ${viewMode === "table" ? "btn-active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Table View
          </button>
          <button
            className={`btn ${viewMode === "graph" ? "btn-active" : ""}`}
            onClick={() => setViewMode("graph")}
          >
            Graph View
          </button>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg my-2">
            <span>Error: {error}</span>
          </div>
        )}

        {viewMode === "table" && (
          <>
            {/* New dynamic table for any label from the full graph */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Dynamic Node Table</h2>

              {/* Label selection dropdown */}
              {uniqueLabels.length > 0 && (
                <div className="form-control w-full max-w-xs mb-4">
                  <label className="label">
                    <span className="label-text">Select Node Label:</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                  >
                    {uniqueLabels.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {nodesForSelectedLabel.length === 0 && (
                <p className="text-sm">No nodes found for the selected label.</p>
              )}
              {nodesForSelectedLabel.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table w-full table-zebra">
                    <thead>
                      <tr>
                        {/* Always show 'id' and 'label', plus each property */}
                        <th>ID</th>
                        <th>Label</th>
                        {propertyKeysArray.map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodesForSelectedLabel.map((node, idx) => (
                        <tr key={`${node.id}-${idx}`}>
                          <td>{node.id}</td>
                          <td>{node.label}</td>
                          {propertyKeysArray.map((key) => (
                            <td key={`${node.id}-${key}`}>
                              {node[key] !== undefined ? String(node[key]) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === "graph" && (
          <div style={{ width: "100%", height: "600px", border: "1px solid #333" }}>
            {aframeLoaded ? (
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="label"
                linkLabel="label"
                nodeAutoColorBy="label"
                linkAutoColorBy="label"
                onNodeClick={(node: any) => {
                  alert(`Clicked node: ${JSON.stringify(node, null, 2)}`);
                }}
              />
            ) : (
              <p>Loading AFRAME...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
