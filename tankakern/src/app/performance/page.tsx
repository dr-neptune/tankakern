"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import { daisyNightTheme } from "../../theme/plotlyTheme";

export default function PerformancePage() {
  // 1) State for synthetic "fake time series" (not the PE data).
  const [data, setData] = useState<
    Array<{ name: string; data: Array<{ timestamp: string; value: number }> }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Synthetic time-series parameters
  const [steps, setSteps] = useState<number>(100);
  const [startingValue, setStartingValue] = useState<number>(0);
  const [numProcesses, setNumProcesses] = useState<number>(1);

  // 2) State for generating "PE data" - T_c, T_l are user-selectable.
  //    We'll default T_c=5, T_l=6 so we see a partial shorter dataset.
  const [peTc, setPeTc] = useState<number>(5.0);
  const [peTl, setPeTl] = useState<number>(6.0);

  // The returned "PE data"
  const [peData, setPeData] = useState<any>(null);
  const [peLoading, setPeLoading] = useState<boolean>(false);

  // 3) State for "Buchner" model
  const [buchnerKappa, setBuchnerKappa] = useState<number>(2.0);       
  const [buchnerTheta, setBuchnerTheta] = useState<number>(0.5);       
  const [buchnerSigmaDelta, setBuchnerSigmaDelta] = useState<number>(0.3); 
  const [buchnerAlpha, setBuchnerAlpha] = useState<number>(0.03);      
  const [buchnerM, setBuchnerM] = useState<number>(1.6);              
  const [buchnerSigmaP, setBuchnerSigmaP] = useState<number>(0.2);     
  const [buchnerProjectionYears, setBuchnerProjectionYears] = useState<number>(4.0); 
  const [buchnerDt, setBuchnerDt] = useState<number>(0.25);           
  const [buchnerRandomState, setBuchnerRandomState] = useState<number>(42);
  const [buchnerCommittedCap, setBuchnerCommittedCap] = useState<number>(100);

  // The returned Buchner data
  const [buchnerData, setBuchnerData] = useState<any>(null);

  // -----------------------------------
  // 4) Fetch the "fake time series" from /performance/timeseries
  // -----------------------------------
  const fetchData = () => {
    setLoading(true);
    fetch(
      `http://localhost:8000/performance/timeseries?steps=${steps}&starting_value=${startingValue}&num_processes=${numProcesses}`
    )
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

  // Layout for the synthetic "fake time series"
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
    marker: {
      color: daisyNightTheme.layout.colorway[index % daisyNightTheme.layout.colorway.length],
    },
  }));

  // -----------------------------------
  // 5) Utility for cumsum
  // -----------------------------------
  const cumsum = (arr: number[]) => {
    let total = 0;
    return arr.map((val) => {
      total += val;
      return total;
    });
  };

  // -----------------------------------
  // 6) Fetch "PE data" from /performance/pe_cashflows, using T_c & T_l
  // -----------------------------------
  const fetchPEData = () => {
    setPeLoading(true);

    const queryParams = new URLSearchParams({
      T_c: peTc.toString(),
      T_l: peTl.toString(),
      dt: "0.25", // we'll keep dt=quarterly
      C: "100",
      kappa: "2.0",
      theta: "0.5",
      sigma_delta: "0.3",
      alpha: "0.03",
      m: "1.6",
      sigma_P: "0.2",
      random_state: "42",
      dist_lag: "2.0"
    });

    fetch(`http://localhost:8000/performance/pe_cashflows?${queryParams.toString()}`)
      .then((resp) => resp.json())
      .then((res) => {
        setPeData(res);
        setPeLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching PE cashflows:", err);
        setPeLoading(false);
      });
  };

  // Convert peData => Plot Data
  const getPEPlotData = (pe: any) => {
    if (!pe || !pe.dates || !pe.calls || !pe.dists) {
      return { nonCumulative: [], cumulative: [] };
    }

    // Actual calls & distributions
    const nonCumulative = [
      {
        x: pe.dates,
        y: pe.calls,
        type: "scatter",
        mode: "lines+markers",
        name: "Actual Calls",
        line: { color: "#1f77b4", width: 3 },
        marker: { color: "#1f77b4", size: 5 },
      },
      {
        x: pe.dates,
        y: pe.dists,
        type: "scatter",
        mode: "lines+markers",
        name: "Actual Dists",
        line: { color: "#ff7f0e", width: 3 },
        marker: { color: "#ff7f0e", size: 5 },
      },
    ];

    const cCalls = cumsum(pe.calls);
    const cDists = cumsum(pe.dists);
    const cumulative = [
      {
        x: pe.dates,
        y: cCalls,
        type: "scatter",
        mode: "lines+markers",
        name: "Cumu Calls",
        line: { color: "#2ca02c", width: 3 },
        marker: { color: "#2ca02c", size: 5 },
      },
      {
        x: pe.dates,
        y: cDists,
        type: "scatter",
        mode: "lines+markers",
        name: "Cumu Dists",
        line: { color: "#d62728", width: 3 },
        marker: { color: "#d62728", size: 5 },
      },
    ];

    return { nonCumulative, cumulative };
  };

  const { nonCumulative: pePlotData, cumulative: pePlotDataCumulative } = getPEPlotData(peData);

  // -----------------------------------
  // 7) Buchner Model Projection
  // -----------------------------------
  const runBuchnerProjection = async () => {
    if (!peData || !peData.dates || !peData.calls || !peData.dists) {
      alert("No valid PE data to use as historical input!");
      return;
    }

    // Historical input for Buchner
    const historicalArr = peData.dates.map((d: string, i: number) => ({
      date: d,
      call: peData.calls[i],
      dist: peData.dists[i],
    }));

    const body = {
      historical_data: historicalArr,
      kappa: buchnerKappa,
      theta: buchnerTheta,
      sigma_delta: buchnerSigmaDelta,
      alpha: buchnerAlpha,
      m: buchnerM,
      sigma_P: buchnerSigmaP,
      projection_years: buchnerProjectionYears,
      dt: buchnerDt,
      random_state: buchnerRandomState,
      committed_cap: buchnerCommittedCap
    };

    try {
      const resp = await fetch("http://localhost:8000/performance/buchner_projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await resp.json();
      setBuchnerData(result);
    } catch (err) {
      console.error("Error calling Buchner model:", err);
    }
  };

  // Convert Buchner data => Plot Data
  const getBuchnerPlotData = (bd: any) => {
    if (!bd || !bd.dates || !bd.calls || !bd.dists) {
      return { nonCumulative: [], cumulative: [] };
    }

    const nonCumulative = [
      {
        x: bd.dates,
        y: bd.calls,
        type: "scatter",
        mode: "lines+markers",
        name: "Proj Calls",
        line: { color: "#9467bd", width: 2, dash: "dot" },
        marker: { color: "#9467bd", size: 4, symbol: "triangle-up" },
      },
      {
        x: bd.dates,
        y: bd.dists,
        type: "scatter",
        mode: "lines+markers",
        name: "Proj Dists",
        line: { color: "#8c564b", width: 2, dash: "dot" },
        marker: { color: "#8c564b", size: 4, symbol: "triangle-up" },
      },
    ];

    const cCalls = cumsum(bd.calls);
    const cDists = cumsum(bd.dists);
    const cumulative = [
      {
        x: bd.dates,
        y: cCalls,
        type: "scatter",
        mode: "lines+markers",
        name: "Proj Cumu Calls",
        line: { color: "#e377c2", width: 2, dash: "dot" },
        marker: { color: "#e377c2", size: 4, symbol: "triangle-up" },
      },
      {
        x: bd.dates,
        y: cDists,
        type: "scatter",
        mode: "lines+markers",
        name: "Proj Cumu Dists",
        line: { color: "#7f7f7f", width: 2, dash: "dot" },
        marker: { color: "#7f7f7f", size: 4, symbol: "triangle-up" },
      },
    ];

    return { nonCumulative, cumulative };
  };

  const { nonCumulative: buchnerPlotData, cumulative: buchnerPlotDataCumulative } = getBuchnerPlotData(buchnerData);

  // Merge final sets
  const finalNonCumulativeData = [...pePlotData, ...buchnerPlotData];
  const finalCumulativeData = [...pePlotDataCumulative, ...buchnerPlotDataCumulative];

  // Layout for merged charts
  const peLayout = {
    ...daisyNightTheme.layout,
    title: "PE Cashflows (Actual vs. Projected)",
    xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
    yaxis: { ...daisyNightTheme.layout.yaxis, title: "Amount" },
    autosize: true,
    legend: {
      orientation: "h",
      yanchor: "top",
      y: -0.2,
      xanchor: "center",
      x: 0.5,
    },
  };

  const peLayoutCumulative = {
    ...daisyNightTheme.layout,
    title: "Cumulative J-Curve (Actual vs. Projected)",
    xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
    yaxis: { ...daisyNightTheme.layout.yaxis, title: "Cumulative Amount" },
    autosize: true,
    legend: {
      orientation: "h",
      yanchor: "top",
      y: -0.2,
      xanchor: "center",
      x: 0.5,
    },
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance</h1>

      {/* 1) "Fake Time Series" Controls */}
      <div className="flex flex-col md:flex-row items-center mb-6 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label className="font-bold">Steps</label>
            <div className="tooltip tooltip-top" data-tip="Number of data points for synthetic time series.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label className="font-bold">Start Val</label>
            <div className="tooltip tooltip-top" data-tip="Initial offset for the synthetic series.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            value={startingValue}
            onChange={(e) => setStartingValue(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label className="font-bold">Processes</label>
            <div className="tooltip tooltip-top" data-tip="Number of parallel processes for the synthetic series.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            value={numProcesses}
            onChange={(e) => setNumProcesses(Number(e.target.value))}
            className="input input-bordered w-32"
            min={1}
            max={10}
          />
        </div>

        <button className="btn btn-primary" onClick={fetchData}>
          Refresh Plot
        </button>
      </div>

      {/* Synthetic time series plot */}
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

      <hr className="my-8" />

      {/* 2) Generate Synthetic PE Data: T_c, T_l */}
      <h2 className="text-xl font-semibold mb-2">Generate Synthetic PE Data</h2>
      <div className="flex flex-row flex-wrap gap-4 mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label className="font-bold">T_c</label>
            <div className="tooltip tooltip-top" data-tip="Commitment period in years. Default ~5.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.5"
            value={peTc}
            onChange={(e) => setPeTc(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label className="font-bold">T_l</label>
            <div className="tooltip tooltip-top" data-tip="Total lifetime in years. Setting ~6 for a short dataset.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.5"
            value={peTl}
            onChange={(e) => setPeTl(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>

        <button className="btn btn-secondary" onClick={fetchPEData}>
          Generate PE Data
        </button>
      </div>

      {peData && (
        <p className="text-sm">
          <strong>PE Data Residual NAV: </strong>
          {typeof peData.nav === "number" ? peData.nav.toFixed(2) : "N/A"}
        </p>
      )}
      {peLoading && <p>Loading PE data...</p>}

      <hr className="my-8" />

      {/* 3) Buchner Parameter Controls */}
      <h2 className="text-xl font-semibold mb-2">Buchner Projection</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex flex-col w-40">
          <div className="flex items-center gap-1">
            <label className="font-bold">kappa</label>
            <div className="tooltip tooltip-top" data-tip="Speed of mean reversion for calls (CIR). ~2.0 typical.">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={buchnerKappa}
            onChange={(e) => setBuchnerKappa(Number(e.target.value))}
            className="input input-bordered w-full"
          />
        </div>
        {/* ... repeat for all Buchner fields ... */}
        <div className="flex flex-col w-44">
          <div className="flex items-center gap-1">
            <label className="font-bold">Proj Years</label>
            <div
              className="tooltip tooltip-top"
              data-tip="Extra years to simulate beyond the last historical date."
            >
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            value={buchnerProjectionYears}
            step="0.5"
            onChange={(e) => setBuchnerProjectionYears(Number(e.target.value))}
            className="input input-bordered w-full"
          />
        </div>
        {/* etc. */}
      </div>

      <button className="btn btn-accent mb-4" onClick={runBuchnerProjection}>
        Run Buchner Model
      </button>

      {/* Display leftover nav from Buchner */}
      {buchnerData && (
        <p className="text-sm">
          <strong>Buchner Residual NAV: </strong>
          {typeof buchnerData.nav === "number" ? buchnerData.nav.toFixed(2) : "N/A"}
        </p>
      )}

      {/* Show final plots: left=non-cumulative, right=cumulative */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h3 className="font-bold">Non-cumulative</h3>
          <Plot
            data={[...pePlotData, ...getBuchnerPlotData(buchnerData).nonCumulative]}
            layout={{
              ...daisyNightTheme.layout,
              title: "PE (Actual) + Projection (Buchner)",
              xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
              yaxis: { ...daisyNightTheme.layout.yaxis, title: "Amount" },
              autosize: true,
              legend: {
                orientation: "h",
                yanchor: "top",
                y: -0.2,
                xanchor: "center",
                x: 0.5,
              },
            }}
            style={{ width: "100%", height: "500px" }}
            useResizeHandler={true}
          />
        </div>
        <div className="w-full md:w-1/2">
          <h3 className="font-bold">Cumulative</h3>
          <Plot
            data={[...pePlotDataCumulative, ...getBuchnerPlotData(buchnerData).cumulative]}
            layout={{
              ...daisyNightTheme.layout,
              title: "Cumulative J-Curve: Actual + Projected",
              xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
              yaxis: { ...daisyNightTheme.layout.yaxis, title: "Cumulative Amount" },
              autosize: true,
              legend: {
                orientation: "h",
                yanchor: "top",
                y: -0.2,
                xanchor: "center",
                x: 0.5,
              },
            }}
            style={{ width: "100%", height: "500px" }}
            useResizeHandler={true}
          />
        </div>
      </div>
    </div>
  );
}
