"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import { daisyNightTheme } from "../../theme/plotlyTheme";

export default function PerformancePage() {
  // ---------------------------------------------
  // 1) Time-series (fake) states
  // ---------------------------------------------
  const [data, setData] = useState<
    Array<{ name: string; data: Array<{ timestamp: string; value: number }> }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Synthetic time-series controls
  const [steps, setSteps] = useState<number>(100);
  const [startingValue, setStartingValue] = useState<number>(0);
  const [numProcesses, setNumProcesses] = useState<number>(1);

  // ---------------------------------------------
  // 2) Synthetic PE data states
  // ---------------------------------------------
  // Basic
  const [peT_c, setPeT_c] = useState<number>(5.0);
  const [peT_l, setPeT_l] = useState<number>(10.0);
  const [peC, setPeC] = useState<number>(100);
  const [peAlpha, setPeAlpha] = useState<number>(0.03);
  const [peM, setPeM] = useState<number>(1.6);

  // Advanced
  const [peKappa, setPeKappa] = useState<number>(2.0);
  const [peTheta, setPeTheta] = useState<number>(0.5);
  const [peSigmaDelta, setPeSigmaDelta] = useState<number>(0.3);
  const [peSigmaP, setPeSigmaP] = useState<number>(0.2);
  const [peDt, setPeDt] = useState<number>(0.25);
  const [peRandomState, setPeRandomState] = useState<number>(42);
  const [peDistLag, setPeDistLag] = useState<number>(2.0);

  const [peData, setPeData] = useState<any>(null);
  const [peLoading, setPeLoading] = useState<boolean>(false);

  // Collapsible for advanced PE
  const [showAdvancedPE, setShowAdvancedPE] = useState<boolean>(false);

  // ---------------------------------------------
  // 3) Buchner model states
  // ---------------------------------------------
  // Basic
  const [buchnerKappa, setBuchnerKappa] = useState<number>(2.0);
  const [buchnerTheta, setBuchnerTheta] = useState<number>(0.5);
  const [buchnerAlpha, setBuchnerAlpha] = useState<number>(0.03);
  const [buchnerM, setBuchnerM] = useState<number>(1.6);

  // Advanced
  const [buchnerSigmaDelta, setBuchnerSigmaDelta] = useState<number>(0.3);
  const [buchnerSigmaP, setBuchnerSigmaP] = useState<number>(0.2);
  const [buchnerProjectionYears, setBuchnerProjectionYears] = useState<number>(5.0);
  const [buchnerDt, setBuchnerDt] = useState<number>(0.25);
  const [buchnerRandomState, setBuchnerRandomState] = useState<number>(42);
  const [buchnerCommittedCap, setBuchnerCommittedCap] = useState<number>(100);

  const [buchnerData, setBuchnerData] = useState<any>(null);

  // Collapsible for advanced Buchner
  const [showAdvancedBuchner, setShowAdvancedBuchner] = useState<boolean>(false);

  // ---------------------------------------------
  // 4) "Sync to Buchner" toggle
  // ---------------------------------------------
  const [syncBuchner, setSyncBuchner] = useState<boolean>(false);

  // If sync is enabled, whenever the PE parameters change, we copy them to the Buchner model
  // We'll do so in a useEffect or in the relevant callback
  useEffect(() => {
    if (!syncBuchner) return;
    // Basic
    setBuchnerKappa(peKappa);
    setBuchnerTheta(peTheta);
    setBuchnerAlpha(peAlpha);
    setBuchnerM(peM);
    // Advanced
    setBuchnerSigmaDelta(peSigmaDelta);
    setBuchnerSigmaP(peSigmaP);
    // We don't auto-sync the projection years, because that's a forward-sim param
    setBuchnerDt(peDt);
    setBuchnerRandomState(peRandomState);
    // We'll sync the committedCap from peC
    setBuchnerCommittedCap(peC);
  }, [
    syncBuchner,
    peKappa,
    peTheta,
    peAlpha,
    peM,
    peSigmaDelta,
    peSigmaP,
    peDt,
    peRandomState,
    peC,
  ]);

  // ---------------------------------------------
  // 5) Fake timeseries fetch
  // ---------------------------------------------
  const fetchFakeTimeSeries = () => {
    setLoading(true);
    const url = `http://localhost:8000/performance/timeseries?steps=${steps}&starting_value=${startingValue}&num_processes=${numProcesses}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((res) => {
        if (res.data) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching timeseries data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFakeTimeSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layout for the fake timeseries
  const timeseriesLayout = {
    ...daisyNightTheme.layout,
    title: "Synthetic Time Series",
    xaxis: { ...daisyNightTheme.layout.xaxis, title: "Time" },
    yaxis: { ...daisyNightTheme.layout.yaxis, title: "Value" },
    autosize: true,
  };

  const timeseriesData = data.map((series, idx) => ({
    x: series.data.map((item) => item.timestamp),
    y: series.data.map((item) => item.value),
    type: "scatter",
    mode: "lines+markers",
    name: series.name,
    marker: {
      color: daisyNightTheme.layout.colorway[idx % daisyNightTheme.layout.colorway.length],
    },
  }));

  // ---------------------------------------------
  // 6) Utility: cumsum
  // ---------------------------------------------
  const cumsum = (arr: number[]) => {
    let total = 0;
    return arr.map((val) => {
      total += val;
      return total;
    });
  };

  // ---------------------------------------------
  // 7) Generate synthetic PE data
  // ---------------------------------------------
  const fetchPEData = () => {
    setPeLoading(true);
    const queryParams = new URLSearchParams({
      T_c: peT_c.toString(),
      T_l: peT_l.toString(),
      dt: peDt.toString(),
      C: peC.toString(),
      kappa: peKappa.toString(),
      theta: peTheta.toString(),
      sigma_delta: peSigmaDelta.toString(),
      alpha: peAlpha.toString(),
      m: peM.toString(),
      sigma_P: peSigmaP.toString(),
      random_state: peRandomState.toString(),
      dist_lag: peDistLag.toString(),
    });
    const url = `http://localhost:8000/performance/pe_cashflows?${queryParams.toString()}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((res) => {
        setPeData(res);
        setPeLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching PE data:", err);
        setPeLoading(false);
      });
  };

  // Convert peData -> plot
  const getPEPlotData = (pe: any) => {
    if (!pe || !pe.dates || !pe.calls || !pe.dists) {
      return { nonCumulative: [], cumulative: [] };
    }
    // Non-cumulative
    const nonCumulative = [
      {
        x: pe.dates,
        y: pe.calls,
        type: "scatter",
        mode: "lines+markers",
        name: "PE Calls",
        line: { color: "#1f77b4", width: 3 },
        marker: { color: "#1f77b4", size: 5 },
      },
      {
        x: pe.dates,
        y: pe.dists,
        type: "scatter",
        mode: "lines+markers",
        name: "PE Dists",
        line: { color: "#ff7f0e", width: 3 },
        marker: { color: "#ff7f0e", size: 5 },
      },
    ];
    // Cumulative
    const cCalls = cumsum(pe.calls);
    const cDists = cumsum(pe.dists);
    const cumulative = [
      {
        x: pe.dates,
        y: cCalls,
        type: "scatter",
        mode: "lines+markers",
        name: "PE Cumu Calls",
        line: { color: "#2ca02c", width: 3 },
        marker: { color: "#2ca02c", size: 5 },
      },
      {
        x: pe.dates,
        y: cDists,
        type: "scatter",
        mode: "lines+markers",
        name: "PE Cumu Dists",
        line: { color: "#d62728", width: 3 },
        marker: { color: "#d62728", size: 5 },
      },
    ];
    return { nonCumulative, cumulative };
  };
  const { nonCumulative: pePlotData, cumulative: pePlotDataCumulative } = getPEPlotData(peData);

  // ---------------------------------------------
  // 8) Buchner model projection
  // ---------------------------------------------
  const runBuchnerModel = async () => {
    if (!peData?.dates || !peData?.calls || !peData?.dists) {
      alert("No valid PE data to use as historical input!");
      return;
    }
    const historical_data = peData.dates.map((d: string, i: number) => ({
      date: d,
      call: peData.calls[i],
      dist: peData.dists[i],
    }));
    const payload = {
      historical_data,
      kappa: buchnerKappa,
      theta: buchnerTheta,
      sigma_delta: buchnerSigmaDelta,
      alpha: buchnerAlpha,
      m: buchnerM,
      sigma_P: buchnerSigmaP,
      projection_years: buchnerProjectionYears,
      dt: buchnerDt,
      random_state: buchnerRandomState,
      committed_cap: buchnerCommittedCap,
    };
    try {
      const resp = await fetch("http://localhost:8000/performance/buchner_projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await resp.json();
      setBuchnerData(result);
    } catch (err) {
      console.error("Error in Buchner model:", err);
    }
  };

  // Convert Buchner data -> plot
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
        name: "Projected Calls",
        line: { color: "#9467bd", width: 2, dash: "dot" },
        marker: { color: "#9467bd", size: 4, symbol: "triangle-up" },
      },
      {
        x: bd.dates,
        y: bd.dists,
        type: "scatter",
        mode: "lines+markers",
        name: "Projected Dists",
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

  // Merge final data for the main chart
  const finalNonCumulativeData = [...pePlotData, ...buchnerPlotData];
  const finalCumulativeData = [...pePlotDataCumulative, ...buchnerPlotDataCumulative];

  // Layout for combined
  const combinedLayout = {
    ...daisyNightTheme.layout,
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Performance</h1>

      {/* ---- 1) Synthetic Time Series ---- */}
      <h2 className="text-xl font-semibold mb-2">1) Synthetic Time Series</h2>
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        {/* Steps */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">Steps</label>
            <div className="tooltip tooltip-top" data-tip="Number of data points to simulate.">
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
        {/* Start Val */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">Start Val</label>
            <div className="tooltip tooltip-top" data-tip="Initial offset for the time series.">
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
        {/* Processes */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">Processes</label>
            <div className="tooltip tooltip-top" data-tip="How many parallel time series to generate.">
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

        <button className="btn btn-primary" onClick={fetchFakeTimeSeries}>
									    Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <Plot
          data={timeseriesData}
          layout={timeseriesLayout}
          style={{ width: "100%", height: "400px" }}
          useResizeHandler={true}
        />
      )}

      <hr className="my-8" />

      {/* ---- 2) Generate Synthetic PE Data ---- */}
      <h2 className="text-xl font-semibold mb-2">2) Generate Synthetic PE Data</h2>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {/* T_c */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">T<sub>c</sub></label>
            <div className="tooltip tooltip-top" data-tip="Commitment period in years (typ ~5).">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.5"
            value={peT_c}
            onChange={(e) => setPeT_c(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
        {/* T_l */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">T<sub>l</sub></label>
            <div className="tooltip tooltip-top" data-tip="Total lifetime in years (typ ~10).">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.5"
            value={peT_l}
            onChange={(e) => setPeT_l(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
        {/* C */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">C</label>
            <div className="tooltip tooltip-top" data-tip="Committed capital (e.g. 100).">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            value={peC}
            step="10"
            onChange={(e) => setPeC(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
        {/* alpha */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">α</label>
            <div className="tooltip tooltip-top" data-tip="Distribution speed (typ ~0.03).">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            value={peAlpha}
            onChange={(e) => setPeAlpha(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
        {/* m */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">m</label>
            <div className="tooltip tooltip-top" data-tip="Final multiple of capital (typ ~1.6).">
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={peM}
            onChange={(e) => setPeM(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
        <button className="btn btn-secondary" onClick={fetchPEData}>
								      Generate PE Data
        </button>
      </div>

      {peLoading && <p>Loading PE data...</p>}
      {peData && (
        <p className="text-sm mb-2">
          <strong>PE Data Residual NAV:</strong>{" "}
          {typeof peData.nav === "number" ? peData.nav.toFixed(2) : "N/A"}
        </p>
      )}

      {/* Collapsible advanced panel for the rest of the parameters */}
      <div
        tabIndex={0}
        className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box w-full mb-6"
      >
        <input
          type="checkbox"
          checked={showAdvancedPE}
          onChange={() => setShowAdvancedPE((prev) => !prev)}
        />
        <div className="collapse-title text-lg font-medium">
							      Advanced PE Options
        </div>
        <div className="collapse-content">
          <div className="flex flex-wrap gap-4 mt-2">
            {/* kappa */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">κ</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Speed of mean reversion for calls (typ ~2)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={peKappa}
                onChange={(e) => setPeKappa(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* theta */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">θ</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Long-run mean call rate fraction (typ ~0.5)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={peTheta}
                onChange={(e) => setPeTheta(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* sigma_delta */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">σδ</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Volatility of calls (typ ~0.3)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={peSigmaDelta}
                onChange={(e) => setPeSigmaDelta(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* sigma_P */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">σP</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Volatility in distributions (typ ~0.2)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={peSigmaP}
                onChange={(e) => setPeSigmaP(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* dt */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">dt</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Timestep in years (typ 0.25)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={peDt}
                onChange={(e) => setPeDt(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* random_state */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">Seed</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Random seed for reproducibility (PE data)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                value={peRandomState}
                onChange={(e) => setPeRandomState(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* dist_lag */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">dist_lag</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Lag in years before distributions begin (typ ~2)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.5"
                value={peDistLag}
                onChange={(e) => setPeDistLag(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      {/* If PE data is loaded, show it */}
      {peData && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">Synthetic PE Data (Non-cumulative & Cumulative)</h3>
          <p className="text-sm mb-2">
            <strong>PE Data Residual NAV:</strong>{" "}
            {typeof peData.nav === "number" ? peData.nav.toFixed(2) : "N/A"}
          </p>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <Plot
                data={pePlotData}
                layout={{
                  ...combinedLayout,
                  title: "PE Calls & Distributions",
                }}
                style={{ width: "100%", height: "400px" }}
                useResizeHandler={true}
              />
            </div>
            <div className="w-full md:w-1/2">
              <Plot
                data={pePlotDataCumulative}
                layout={{
                  ...combinedLayout,
                  title: "Cumulative PE",
                }}
                style={{ width: "100%", height: "400px" }}
                useResizeHandler={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---- 3) Buchner Model Projection ---- */}
      <h2 className="text-xl font-semibold mb-2">3) Buchner Model Projection</h2>

      {/* Sync checkbox */}
      <div className="form-control mb-4">
        <label className="cursor-pointer label">
          <span className="label-text font-bold mr-2">Sync to PE Params?</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={syncBuchner}
            onChange={() => setSyncBuchner((prev) => !prev)}
          />
        </label>
        <p className="text-sm ml-2 mt-1">
					   When enabled, κ, θ, α, m, σδ, σP, dt, Seed, and C will be synced from the PE data parameters above.
        </p>
      </div>

      <div className="flex flex-row flex-wrap gap-4 mb-4 items-center">
        {/* kappa */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">κ</label>
            <div
              className="tooltip tooltip-top"
              data-tip="Speed of mean reversion for calls (CIR)."
            >
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={buchnerKappa}
            onChange={(e) => setBuchnerKappa(Number(e.target.value))}
            className="input input-bordered w-32"
            disabled={syncBuchner}
          />
        </div>
        {/* theta */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">θ</label>
            <div
              className="tooltip tooltip-top"
              data-tip="Long-run mean call rate fraction (typ ~0.5)."
            >
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={buchnerTheta}
            onChange={(e) => setBuchnerTheta(Number(e.target.value))}
            className="input input-bordered w-32"
            disabled={syncBuchner}
          />
        </div>
        {/* alpha */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">α</label>
            <div
              className="tooltip tooltip-top"
              data-tip="Distribution speed (typ ~0.03)."
            >
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            value={buchnerAlpha}
            onChange={(e) => setBuchnerAlpha(Number(e.target.value))}
            className="input input-bordered w-32"
            disabled={syncBuchner}
          />
        </div>
        {/* m */}
        <div className="flex flex-col">
          <div className="flex gap-1 items-center">
            <label className="font-bold">m</label>
            <div
              className="tooltip tooltip-top"
              data-tip="Final multiple of capital (typ ~1.6)."
            >
              <span className="cursor-pointer text-secondary">?</span>
            </div>
          </div>
          <input
            type="number"
            step="0.1"
            value={buchnerM}
            onChange={(e) => setBuchnerM(Number(e.target.value))}
            className="input input-bordered w-32"
            disabled={syncBuchner}
          />
        </div>

        <button className="btn btn-accent" onClick={runBuchnerModel}>
								       Run Buchner
        </button>
      </div>

      {/* Collapsible for advanced Buchner */}
      <div
        tabIndex={0}
        className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box w-full mb-6"
      >
        <input
          type="checkbox"
          checked={showAdvancedBuchner}
          onChange={() => setShowAdvancedBuchner((p) => !p)}
        />
        <div className="collapse-title text-lg font-medium">
							      Advanced Buchner Options
        </div>
        <div className="collapse-content">
          <div className="flex flex-wrap gap-4 mt-2">
            {/* sigma_delta */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">σδ</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Volatility of calls in Buchner (typ ~0.3)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={buchnerSigmaDelta}
                onChange={(e) => setBuchnerSigmaDelta(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={syncBuchner}
              />
            </div>
            {/* sigma_P */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">σP</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Volatility in distributions for Buchner (typ ~0.2)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={buchnerSigmaP}
                onChange={(e) => setBuchnerSigmaP(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={syncBuchner}
              />
            </div>
            {/* projection_years */}
            <div className="flex flex-col w-44">
              <div className="flex gap-1 items-center">
                <label className="font-bold">Projection Yrs</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Additional years to project beyond the last historical date."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.5"
                value={buchnerProjectionYears}
                onChange={(e) => setBuchnerProjectionYears(Number(e.target.value))}
                className="input input-bordered w-full"
              />
            </div>
            {/* dt */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">dt</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Timestep in years for Buchner (quarterly=0.25)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={buchnerDt}
                onChange={(e) => setBuchnerDt(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={syncBuchner}
              />
            </div>
            {/* random_state */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">Seed</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Random seed for Buchner model."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                value={buchnerRandomState}
                onChange={(e) => setBuchnerRandomState(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={syncBuchner}
              />
            </div>
            {/* committed_cap */}
            <div className="flex flex-col w-40">
              <div className="flex gap-1 items-center">
                <label className="font-bold">C</label>
                <div
                  className="tooltip tooltip-top"
                  data-tip="Total Committed Capital for Buchner (e.g. 100)."
                >
                  <span className="cursor-pointer text-secondary">?</span>
                </div>
              </div>
              <input
                type="number"
                step="10"
                value={buchnerCommittedCap}
                onChange={(e) => setBuchnerCommittedCap(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={syncBuchner}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Show Buchner results (combined with PE) */}
      {buchnerData && (
        <p className="text-sm mb-2">
          <strong>Buchner Residual NAV:</strong>{" "}
          {typeof buchnerData.nav === "number" ? buchnerData.nav.toFixed(2) : "N/A"}
        </p>
      )}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h3 className="font-bold">Non-cumulative</h3>
          <Plot
            data={finalNonCumulativeData}
            layout={{
              ...combinedLayout,
              title: "PE + Buchner (Non-cumulative)",
            }}
            style={{ width: "100%", height: "400px" }}
            useResizeHandler={true}
          />
        </div>
        <div className="w-full md:w-1/2">
          <h3 className="font-bold">Cumulative</h3>
          <Plot
            data={finalCumulativeData}
            layout={{
              ...combinedLayout,
              title: "PE + Buchner (Cumulative)",
            }}
            style={{ width: "100%", height: "400px" }}
            useResizeHandler={true}
          />
        </div>
      </div>
    </div>
  );
}
