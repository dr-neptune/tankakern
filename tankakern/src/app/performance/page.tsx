"use client";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { daisyNightTheme } from "../../theme/plotlyTheme";

export default function PerformancePage() {
  const [data, setData] = useState<Array<{ timestamp: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/timeseries")
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

  const plotData = [
    {
      x: data.map((item) => item.timestamp),
      y: data.map((item) => item.value),
      type: "scatter",
      mode: "lines+markers",
      marker: { color: daisyNightTheme.layout.colorway[0] },
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance</h1>
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
