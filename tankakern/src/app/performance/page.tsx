"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import { daisyNightTheme } from "../../theme/plotlyTheme";

export default function PerformancePage() {
  const [data, setData] = useState<Array<{ name: string; data: Array<{ timestamp: string; value: number }> }>>([]);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<number>(100);
  const [startingValue, setStartingValue] = useState<number>(0);
  const [numProcesses, setNumProcesses] = useState<number>(1);

  const fetchData = () => {
    setLoading(true);
    fetch(`http://localhost:8000/performance/timeseries?steps=${steps}&starting_value=${startingValue}&num_processes=${numProcesses}`)
      .then((response) => response.json())
      .then((result) => {
        if (result.data) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching timeseries data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/performance/timeseries")
      .then((response) => response.json())
      .then((result) => {
        if (result.data) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching timeseries data:", error);
        setLoading(false);
      });
  }, []);

  const layout = {
    ...daisyNightTheme.layout,
    title: "Time Series Data",
    xaxis: { ...daisyNightTheme.layout.xaxis, title: "Time" },
    yaxis: { ...daisyNightTheme.layout.yaxis, title: "Value" },
    autosize: true,
  };

  const plotData = data.map((series, index) => ({
      x: series.data.map((item) => item.timestamp),
      y: series.data.map((item) => item.value),
      type: "scatter",
      mode: "lines+markers",
      name: series.name,
      marker: { color: daisyNightTheme.layout.colorway[index % daisyNightTheme.layout.colorway.length] },
  }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance</h1>
      <div className="flex flex-col md:flex-row items-center mb-4 gap-4">
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(Number(e.target.value))}
          className="input input-bordered w-32"
          placeholder="Steps"
        />
        <input
          type="number"
          value={startingValue}
          onChange={(e) => setStartingValue(Number(e.target.value))}
          className="input input-bordered w-32"
          placeholder="Starting Value"
        />
        <input
          type="number"
          value={numProcesses}
          onChange={(e) => setNumProcesses(Number(e.target.value))}
          className="input input-bordered w-32"
          placeholder="Processes"
          min={1}
          max={10}
        />
        <button className="btn btn-primary" onClick={fetchData}>
          Refresh Plot
        </button>
      </div>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
        />
      )}
    </div>
  );
}
