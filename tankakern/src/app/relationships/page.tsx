"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import for react-force-graph (using the AFRAME version)
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

interface RawNeo4jRecord {
  keys: string[];
  length: number;
  _fields: any[];
  _fieldLookup: Record<string, number>;
}

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

  // Collect GDS query results (map of queryName -> RawNeo4jRecord[] or error/undefined)
  const [queryResults, setQueryResults] = useState<{
    [queryName: string]: RawNeo4jRecord[] | null | undefined;
  }>({});

  // Load AFRAME on client-side and ensure it's available globally
  useEffect(() => {
    async function loadAframe() {
      try {
        const aframeModule = await import("aframe");
        if (!window.AFRAME) {
          (window as any).AFRAME = aframeModule;
        }
        setAframeLoaded(true);
      } catch (err) {
        console.error("Error loading AFRAME:", err);
        setError(err.message || "Error loading AFRAME");
      }
    }
    loadAframe();
  }, []);

  // Fetch a list of Person nodes
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

  // Handler to run a named query
  async function handleRunQuery(queryName: string) {
    try {
      setError(null);
      // Mark that we're fetching
      setQueryResults((prev) => ({ ...prev, [queryName]: null }));

      const resp = await fetch("http://localhost:8000/relationships/run-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queryName }),
      });
      const data = await resp.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQueryResults((prev) => ({ ...prev, [queryName]: data }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  // We define a set of named queries, labels, and help tooltips
  const queryButtons = [
    {
      name: "degree_centrality",
      label: "Degree Centrality",
      help: "Counts the number of relationships each node has (GDS).",
    },
    {
      name: "betweenness_centrality",
      label: "Betweenness Centrality",
      help: "Identifies bridge nodes that lie on many shortest paths (GDS).",
    },
    {
      name: "pagerank",
      label: "PageRank",
      help: "Computes influence in the network via PageRank (GDS).",
    },
    {
      name: "louvain_community",
      label: "Louvain Community",
      help: "Detects communities of interconnected nodes (GDS).",
    },
    {
      name: "wcc",
      label: "Weakly Connected Components",
      help: "Shows subgraphs that are not connected to each other (GDS).",
    },
    {
      name: "jaccard_similarity",
      label: "Jaccard Similarity",
      help: "Comparisons of deals in common for pairs of people (raw Cypher).",
    },
    {
      name: "triadic_closure",
      label: "Triadic Closure",
      help: "Find potential edges by spotting open triangles (raw Cypher).",
    },
    {
      name: "shortest_path_example",
      label: "Shortest Path (Alice -> Bob)",
      help: "Example shortest path query between two people (raw Cypher).",
    },
    {
      name: "top_schools",
      label: "Top Schools",
      help: "Lists schools with the most alumni (raw Cypher).",
    },
    {
      name: "co_invested_alumni",
      label: "Co-invested Alumni",
      help: "Pairs of alumni from the same school who co-invested (raw Cypher).",
    },
  ];

  // Simple function to display the returned rows from a query
  function renderQueryResult(records: RawNeo4jRecord[]) {
    if (!records || records.length === 0) {
      return <p className="text-sm">No data returned.</p>;
    }
    // We'll assume the first record's "keys" can define the columns
    const columns = records[0].keys;

    return (
      <div className="overflow-x-auto mt-2">
        <table className="table w-full table-zebra">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr key={i}>
                {rec.keys.map((colKey) => {
                  const colIndex = rec._fieldLookup[colKey];
                  const val = rec._fields[colIndex];
                  return (
                    <td key={colKey}>
                      {val !== null && val !== undefined ? val.toString() : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
            {/* Existing table for Person nodes from /relationships/people */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                Person Nodes (endpoint-based)
              </h2>
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

            {/* New dynamic table for any label from the full graph */}
            <div className="mb-8">
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

            {/* Buttons for running the GDS or Cypher queries, with pink ? tooltips */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Run Analysis Queries</h2>
              <div className="flex flex-wrap gap-4">
                {queryButtons.map((qb) => (
                  <div key={qb.name} className="flex items-center gap-2">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleRunQuery(qb.name)}
                    >
                      {qb.label}
                    </button>
                    {/* Pink question mark with tooltip */}
                    <div
                      className="tooltip tooltip-top"
                      data-tip={qb.help}
                    >
                      <span className="cursor-pointer text-pink-500">?</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Render results for each query, if we have them */}
            <div>
              {queryButtons.map((qb) => {
                const res = queryResults[qb.name];
                if (res === undefined) {
                  // hasn't been triggered
                  return null;
                }
                return (
                  <div key={qb.name} className="mb-6 bg-base-200 p-2 rounded">
                    <h3 className="font-bold mb-2 text-md">{qb.label} Results:</h3>
                    {res === null ? (
                      <p className="text-sm">Loading...</p>
                    ) : Array.isArray(res) ? (
                      renderQueryResult(res)
                    ) : (
                      <pre className="text-sm bg-base-300 p-2 rounded">
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "graph" && (
          <div
            style={{
              width: "100%",
              height: "600px",
              border: "1px solid #333",
            }}
          >
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
