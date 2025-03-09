"use client";
import { useState } from "react";

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

      {/* Tabs for each fund: Deals and Cash Flows */}
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
