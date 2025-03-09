"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { daisyNightTheme } from "../../theme/plotlyTheme";
import { DataTable } from "../../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

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

  // Toggle for showing projections
  const [showProjection, setShowProjection] = useState<boolean>(false);
  const [projectedCF, setProjectedCF] = useState<any[]>([]);

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
      setSelectedFundIndex(0);
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFund = useMemo(() => funds[selectedFundIndex], [funds, selectedFundIndex]);
  const selectedCF = useMemo(() => {
    return selectedFund ? cashflows.filter((c: any) => c.fund_name === selectedFund.fund_name) : [];
  }, [selectedFund, cashflows]);
  const selectedDeals = useMemo(() => {
    return selectedFund ? deals.filter((d: any) => d.fund_name === selectedFund.fund_name) : [];
  }, [selectedFund, deals]);

  // Fetch projection when toggle is on and selectedFund changes
  useEffect(() => {
    const fetchProjection = async () => {
      if (!showProjection || !selectedFund) {
        setProjectedCF([]);
        return;
      }
      const fundObj = funds.find((f) => f.fund_name === selectedFund.fund_name);
      if (!fundObj) {
        setProjectedCF([]);
        return;
      }
      try {
        const bodyData = {
          fund_name: selectedFund.fund_name,
          gp_name: selectedFund.gp_name,
          existing_cf: selectedCF,
          vintage_year: fundObj.vintage_year,
        };
        const res = await fetch("http://localhost:8000/track-record/project", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        });
        const result = await res.json();
        if (result.forecast) {
          setProjectedCF(result.forecast);
        }
      } catch (err) {
        console.error("Error fetching projection:", err);
        setProjectedCF([]);
      }
    };

    fetchProjection();
  }, [showProjection, selectedFund, funds, selectedCF]);

  // Columns for tables
  const fundColumns: ColumnDef<any>[] = [
    { header: "Fund Name", accessorKey: "fund_name" },
    { header: "GP Name", accessorKey: "gp_name" },
    { header: "Vintage Year", accessorKey: "vintage_year" },
    {
      header: "Net IRR",
      accessorKey: "net_irr",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Net DPI",
      accessorKey: "net_dpi",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Net TVPI",
      accessorKey: "net_tvpi",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    { header: "Stage", accessorKey: "stage", enableSorting: true },
    { header: "Geo", accessorKey: "geo", enableSorting: true },
  ];

  const dealColumns: ColumnDef<any>[] = [
    { header: "Fund Name", accessorKey: "fund_name", enableSorting: true },
    { header: "GP Name", accessorKey: "gp_name", enableSorting: true },
    { header: "Company", accessorKey: "company_name", enableSorting: true },
    { header: "Stage", accessorKey: "stage", enableSorting: true },
    { header: "Geo", accessorKey: "geo", enableSorting: true },
    {
      header: "Total Value",
      accessorKey: "total_value",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Total Cost",
      accessorKey: "total_cost",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Realized Value",
      accessorKey: "realized_value",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Realized Cost",
      accessorKey: "realized_cost",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "TV/TC",
      accessorKey: "tv_tc",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    {
      header: "Realized?",
      accessorKey: "realized",
      cell: (info) => (info.getValue() ? "Yes" : "No"),
      enableSorting: true,
    },
  ];

  const cfColumns: ColumnDef<any>[] = [
    { header: "Fund Name", accessorKey: "fund_name", enableSorting: true },
    { header: "GP Name", accessorKey: "gp_name", enableSorting: true },
    { header: "Date", accessorKey: "date", enableSorting: true },
    {
      header: "Amount (Millions)",
      accessorKey: "amount_millions",
      cell: (info) => (info.getValue() ? info.getValue().toFixed(2) : null),
      enableSorting: true,
    },
    { header: "Type", accessorKey: "type", enableSorting: true },
  ];

  // Combine existing CF with projected CF if projection is enabled
  let displayedCF = selectedCF;
  if (showProjection && projectedCF.length > 0) {
    displayedCF = [
      ...selectedCF,
      ...projectedCF.map((p: any) => ({
        fund_name: selectedFund?.fund_name,
        gp_name: selectedFund?.gp_name,
        ...p,
      })),
    ];
  }

  // Prepare chart data for individual cash flows
  let plotData: any[] = [];
  let layout: any = {};

  if (selectedFund && displayedCF.length > 0) {
    const sortedCF = [...displayedCF].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
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
        y: -0.2,
        xanchor: "center",
        x: 0.5,
      },
    };
  }

  // Prepare cumulative chart data
  let cumulativePlotData: any[] = [];
  let cumulativeLayout: any = {};

  if (selectedFund && displayedCF.length > 0) {
    const sortedCF = [...displayedCF].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumVal = 0;
    const xVals: string[] = [];
    const yVals: number[] = [];
    const markerColors: string[] = [];
    const callsLegendTrace = {
      x: [] as string[],
      y: [] as number[],
      type: "scatter",
      mode: "markers",
      name: "Calls",
      marker: { color: daisyNightTheme.layout.colorway[0] },
      showlegend: true,
      hoverinfo: "none",
      visible: "legendonly",
    };
    const distributionsLegendTrace = {
      x: [] as string[],
      y: [] as number[],
      type: "scatter",
      mode: "markers",
      name: "Distributions",
      marker: { color: daisyNightTheme.layout.colorway[1] },
      showlegend: true,
      hoverinfo: "none",
      visible: "legendonly",
    };

    sortedCF.forEach((cf) => {
      xVals.push(cf.date);
      cumVal += cf.amount_millions;
      yVals.push(cumVal);
      if (cf.type === "Call") {
        markerColors.push(daisyNightTheme.layout.colorway[0]);
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
      title: `💰 Cumulative Cash Flow for ${selectedFund.fund_name}`,
      xaxis: { ...daisyNightTheme.layout.xaxis, title: "Date" },
      yaxis: { ...daisyNightTheme.layout.yaxis, title: "Cumulative Amount (Millions)" },
      autosize: true,
      legend: {
        orientation: "h",
        yanchor: "top",
        y: -0.2,
        xanchor: "center",
        x: 0.5,
      },
    };
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">GP Track Record Generator</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="form-control">
          <label className="label"><span className="label-text">GP Name</span></label>
          <input type="text" value={gpName} onChange={(e) => setGpName(e.target.value)} className="input input-bordered" placeholder="Enter GP Name" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Number of Funds</span></label>
          <input type="number" value={numFunds} onChange={(e) => setNumFunds(Number(e.target.value))} className="input input-bordered" min={1} max={15} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Deals per Fund</span></label>
          <input type="number" value={numDeals} onChange={(e) => setNumDeals(Number(e.target.value))} className="input input-bordered" min={1} max={100} />
        </div>
      </div>
      <button className={`btn btn-primary ${loading ? "loading" : ""}`} onClick={generateData}>
        {loading ? "Generating..." : "Generate Fund Data"}
      </button>
      {funds.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Funds Table</h2>
          <DataTable columns={fundColumns} data={funds} enableSorting />
        </div>
      )}
      {funds.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Fund Details</h2>
          <div className="tabs tabs-boxed mb-4">
            {funds.map((fund, index) => (
              <a key={index} className={`tab ${selectedFundIndex === index ? "tab-active" : ""}`} onClick={() => setSelectedFundIndex(index)}>
                {fund.fund_name}
              </a>
            ))}
          </div>
          {selectedFund && (
            <div>
              <div className="form-control flex-row items-center mb-4 gap-2">
                <label className="cursor-pointer label">
                  <span className="label-text">Project Future Cash Flows?</span>
                </label>
                <input type="checkbox" className="toggle toggle-primary" checked={showProjection} onChange={() => setShowProjection((prev) => !prev)} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Deals for {selectedFund.fund_name}</h3>
              <DataTable columns={dealColumns} data={selectedDeals} enableSorting />
              {displayedCF.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold mb-2">💸 Cash Flow Chart</h3>
                    <Plot data={plotData} layout={layout} style={{ width: "100%", height: "500px" }} useResizeHandler={true} />
                  </div>
                  <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-bold mb-2">💰 Cumulative Cash Flow Chart</h3>
                    <Plot data={cumulativePlotData} layout={cumulativeLayout} style={{ width: "100%", height: "500px" }} useResizeHandler={true} />
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold mt-6 mb-2">Cash Flows for {selectedFund.fund_name}</h3>
              <DataTable columns={cfColumns} data={displayedCF} enableSorting />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
