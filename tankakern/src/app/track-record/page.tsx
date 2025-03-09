"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { daisyNightTheme } from "../../theme/plotlyTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function TrackRecordPage() {
  const [gpName, setGpName] = useState<string>("");
  const [numFunds, setNumFunds] = useState<number>(5);
  const [numDeals, setNumDeals] = useState<number>(15);

  const [funds, setFunds] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [cashflows, setCashflows] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFundIndex, setSelectedFundIndex] = useState<number>(0);

  const generateData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        gp_name: gpName || "",
        num_funds: numFunds.toString(),
        num_deals: numDeals.toString(),
      });
      const res = await fetch(`http://localhost:8000/track-record/generate?${params}`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      setFunds(data.funds || []);
      setDeals(data.deals || []);
      setCashflows(data.cashflows || []);
      // Reset the selected fund tab
      setSelectedFundIndex(0);
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter deals and cashflows for the selected fund tab
  const selectedFund = funds[selectedFundIndex];
  const selectedDeals = selectedFund
    ? deals.filter((d) => d.fund_name === selectedFund.fund_name)
    : [];
  const selectedCF = selectedFund
    ? cashflows.filter((c) => c.fund_name === selectedFund.fund_name)
    : [];

  // -----------------------------------
  // Chart 1: Individual Cash Flows
  // -----------------------------------
  let plotData: any[] = [];
  let layout: any = {};

  if (selectedFund && selectedCF.length > 0) {
    // Sort by date to ensure the lines are consistent
    const sortedCF = [...selectedCF].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Separate calls vs distributions
    const callData = sortedCF.filter((flow) => flow.type === "Call");
    const distData = sortedCF.filter((flow) => flow.type === "Distribution");

    plotData = [
      {
        x: callData.map((flow) => flow.date),
        y: callData.map((flow) => flow.amount_millions),
        type: "scatter",
        mode: "lines+markers",
        name: "Calls",
        marker: { color: daisyNightTheme.layout.colorway[0] },
      },
      {
        x: distData.map((flow) => flow.date),
        y: distData.map((flow) => flow.amount_millions),
        type: "scatter",
        mode: "lines+markers",
        name: "Distributions",
        marker: { color: daisyNightTheme.layout.colorway[1] },
      },
    ];

    layout = {
      ...daisyNightTheme.layout,
      title: `💸 Cash Flows for ${selectedFund.fund_name}`,
      xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
      yaxis: { ...daisyNightTheme.layout.yaxis, title: "Amount (Millions)" },
      autosize: true,
      legend: {
        orientation: "h",
        yanchor: "top",
        y: -0.2, // place the legend just below the chart
        xanchor: "center",
        x: 0.5,
      },
    };
  }

  // -----------------------------------
  // Chart 2: Cumulative Cash Flow (single line, color-coded markers)
  // -----------------------------------
  let cumulativePlotData: any[] = [];
  let cumulativeLayout: any = {};

  if (selectedCF.length > 0) {
    const sortedCF = [...selectedCF].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Compute cumulative
    let cumVal = 0;
    const xVals: string[] = [];
    const yVals: number[] = [];
    // We'll keep track of each point's color based on Call/Distribution
    const markerColors: string[] = [];

    // We'll add "dummy" traces to show distinct legend entries for Calls and Distributions
    // while still preserving a single line for the total.
    // We won't display lines for these dummy traces, only markers for the legend.
    const callsLegendTrace = {
      x: [],
      y: [],
      type: "scatter",
      mode: "markers",
      name: "Calls",
      marker: { color: daisyNightTheme.layout.colorway[0] },
      showlegend: true,
      hoverinfo: "none",
      visible: "legendonly", // We'll keep them in legend but hide from chart by default
    };
    const distributionsLegendTrace = {
      x: [],
      y: [],
      type: "scatter",
      mode: "markers",
      name: "Distributions",
      marker: { color: daisyNightTheme.layout.colorway[1] },
      showlegend: true,
      hoverinfo: "none",
      visible: "legendonly",
    };

    // Single cumulative line with multi-colored markers
    sortedCF.forEach((cf) => {
      xVals.push(cf.date);
      cumVal += cf.amount_millions;
      yVals.push(cumVal);
      // Decide which color for the marker
      if (cf.type === "Call") {
        markerColors.push(daisyNightTheme.layout.colorway[0]);
        // For legend
        callsLegendTrace.x.push(cf.date);
        callsLegendTrace.y.push(cumVal);
      } else {
        markerColors.push(daisyNightTheme.layout.colorway[1]);
        distributionsLegendTrace.x.push(cf.date);
        distributionsLegendTrace.y.push(cumVal);
      }
    });

    const mainCumulativeTrace = {
      x: xVals,
      y: yVals,
      type: "scatter",
      mode: "lines+markers",
      name: "Cumulative",
      line: { color: daisyNightTheme.layout.colorway[2] },
      marker: { color: markerColors },
    };

    cumulativePlotData = [mainCumulativeTrace, callsLegendTrace, distributionsLegendTrace];

    cumulativeLayout = {
      ...daisyNightTheme.layout,
      title: `💸 Cumulative Cash Flow for ${selectedFund?.fund_name || ""}`,
      xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
      yaxis: { ...daisyNightTheme.layout.yaxis, title: "Cumulative Amount (Millions)" },
      autosize: true,
      legend: {
        orientation: "h",
        yanchor: "top",
        y: -0.2, // place the legend just below the chart
        xanchor: "center",
        x: 0.5,
      },
    };
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">GP Track Record Generator</h2>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">GP Name</span>
          </label>
          <input
            type="text"
            value={gpName}
            onChange={(e) => setGpName(e.target.value)}
            className="input input-bordered"
            placeholder="Enter GP Name"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Number of Funds</span>
          </label>
          <input
            type="number"
            value={numFunds}
            onChange={(e) => setNumFunds(Number(e.target.value))}
            className="input input-bordered"
            min={1}
            max={15}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Deals per Fund</span>
          </label>
          <input
            type="number"
            value={numDeals}
            onChange={(e) => setNumDeals(Number(e.target.value))}
            className="input input-bordered"
            min={1}
            max={100}
          />
        </div>
      </div>

      <button
        className={`btn btn-primary ${loading ? "loading" : ""}`}
        onClick={generateData}
      >
        {loading ? "Generating..." : "Generate Fund Data"}
      </button>

      {/* Funds Table */}
      {funds.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Funds Table</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Fund Name</th>
                  <th>GP Name</th>
                  <th>Vintage Year</th>
                  <th>Net IRR</th>
                  <th>Net DPI</th>
                  <th>Net TVPI</th>
                  <th>Stage</th>
                  <th>Geo</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund, idx) => (
                  <tr key={idx}>
                    <td>{fund.fund_name}</td>
                    <td>{fund.gp_name}</td>
                    <td>{fund.vintage_year}</td>
                    <td>{fund.net_irr.toFixed(2)}</td>
                    <td>{fund.net_dpi.toFixed(2)}</td>
                    <td>{fund.net_tvpi.toFixed(2)}</td>
                    <td>{fund.stage}</td>
                    <td>{fund.geo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs for each fund: Deals, Cash Flows, and Charts */}
      {funds.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Fund Details</h2>
          <div className="tabs tabs-boxed mb-4">
            {funds.map((fund, index) => (
              <a
                key={index}
                className={`tab ${selectedFundIndex === index ? "tab-active" : ""}`}
                onClick={() => setSelectedFundIndex(index)}
              >
                {fund.fund_name}
              </a>
            ))}
          </div>

          {selectedFund && (
            <div>
              {/* Deals Table */}
              <h3 className="text-lg font-semibold mb-2">Deals for {selectedFund.fund_name}</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      <th>GP Name</th>
                      <th>Company</th>
                      <th>Stage</th>
                      <th>Geo</th>
                      <th>Total Value</th>
                      <th>Total Cost</th>
                      <th>Realized Value</th>
                      <th>Realized Cost</th>
                      <th>TV/TC</th>
                      <th>Realized?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDeals.map((deal, dIdx) => (
                      <tr key={dIdx}>
                        <td>{deal.fund_name}</td>
                        <td>{deal.gp_name}</td>
                        <td>{deal.company_name}</td>
                        <td>{deal.stage}</td>
                        <td>{deal.geo}</td>
                        <td>{deal.total_value.toFixed(2)}</td>
                        <td>{deal.total_cost.toFixed(2)}</td>
                        <td>{deal.realized_value.toFixed(2)}</td>
                        <td>{deal.realized_cost.toFixed(2)}</td>
                        <td>{deal.tv_tc.toFixed(2)}</td>
                        <td>{deal.realized ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Charts: Cash Flow (left) and Cumulative Cash Flow (right) */}
              {selectedCF.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: "100%", height: "100%" }}
                      useResizeHandler={true}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <Plot
                      data={cumulativePlotData}
                      layout={cumulativeLayout}
                      style={{ width: "100%", height: "100%" }}
                      useResizeHandler={true}
                    />
                  </div>
                </div>
              )}

              {/* Cash Flow Table */}
              <h3 className="text-lg font-semibold mt-6 mb-2">Cash Flows for {selectedFund.fund_name}</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Fund Name</th>
                      <th>GP Name</th>
                      <th>Date</th>
                      <th>Amount (Millions)</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCF.map((flow, fIdx) => (
                      <tr key={fIdx}>
                        <td>{flow.fund_name}</td>
                        <td>{flow.gp_name}</td>
                        <td>{flow.date}</td>
                        <td>{flow.amount_millions.toFixed(2)}</td>
                        <td>{flow.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
