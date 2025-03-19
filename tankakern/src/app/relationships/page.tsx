"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import for react-force-graph (using the AFRAME version)
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

export default function RelationshipsPage() {
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

  // Load AFRAME on client-side and ensure it's available globally
  useEffect(() => {
    async function loadAframe() {
      try {
        const aframeModule = await import("aframe");
        // Ensure AFRAME is available on the window object
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

  // Fetch people data
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
        // Transform nodes/relationships into ForceGraph format:
        // { nodes: [{ id: ... }, ...], links: [{ source: ..., target: ... }, ...] }
        const transformedNodes = data.nodes.map((n: any) => ({
          id: n.id,
          label: n.labels && n.labels.length > 0 ? n.labels[0] : "Node",
          ...n.properties,
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
          <div>
            <h2 className="text-xl font-semibold mb-2">Person Nodes</h2>
            {people.length === 0 && !error && (
              <p className="text-sm">No people found or still loading...</p>
            )}
            {people.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                  <thead>
                    <tr>
                      <th>Person ID</th>
                      <th>Full Name</th>
                      <th>Primary Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((p) => (
                      <tr key={p.personId}>
                        <td>{p.personId}</td>
                        <td>{p.fullName}</td>
                        <td>{p.primaryTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
