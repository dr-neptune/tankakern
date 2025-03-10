from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import numpy as np

router = APIRouter(tags=["Performance"])


##############################
# 1) Timeseries Route
##############################
@router.get("/timeseries")
def get_timeseries(
    steps: int = 100,
    starting_value: int = 0,
    num_processes: int = Query(1, ge=1, le=10)
):
    """
    Return fake time series data as a list of time series, each
    with timestamp-value pairs. The route will be accessible at:
        GET /performance/timeseries?steps=...&starting_value=...&num_processes=...
    """
    now = datetime.utcnow()
    series_labels = [f"Process {i}" for i in range(1, num_processes + 1)]
    data = []

    for label in series_labels:
        series_data = []
        # Generate data points using a simple Geometric Brownian Motion
        N = steps
        dt = 1
        S0_sim = 1
        mu = 0.05
        sigma = 0.2
        rand = np.random.normal(0, 1, size=N)
        prices = [S0_sim]

        for i in range(1, N):
            new_price = prices[-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * rand[i])
            prices.append(new_price)

        offset = starting_value - prices[0]
        prices = [p + offset for p in prices]
        timestamps = [
            (now - timedelta(minutes=5 * (N - 1 - i))).isoformat() + "Z"
            for i in range(N)
        ]
        for i in range(N):
            series_data.append({"timestamp": timestamps[i], "value": round(prices[i], 2)})

        data.append({"name": label, "data": series_data})

    return {"data": data}


##############################
# 2) PE Cashflows Route
##############################
@router.get("/pe_cashflows")
def get_pe_cashflows(
    T_c: float = 5.0,
    T_l: float = 10.0,
    dt: float = 0.25,
    C: float = 100.0,
    kappa: float = 2.0,
    theta: float = 0.5,
    sigma_delta: float = 0.3,
    alpha: float = 0.03,
    m: float = 1.6,
    sigma_P: float = 0.2,
    random_state: int = 42,
    dist_lag: float = 2.0
):
    """
    Generate synthetic Private Equity cashflows and return them as JSON.
    The route will be accessible at:
        GET /performance/pe_cashflows
    """
    try:
        # Make sure the file 'utils/performance.py' has a function
        # named 'generate_synthetic_pe_cashflows'
        from utils.performance import generate_synthetic_pe_cashflows
    except ImportError:
        return {"error": "generate_synthetic_pe_cashflows not found in utils.performance"}

    result = generate_synthetic_pe_cashflows(
        T_c=T_c,
        T_l=T_l,
        dt=dt,
        C=C,
        kappa=kappa,
        theta=theta,
        sigma_delta=sigma_delta,
        alpha=alpha,
        m=m,
        sigma_P=sigma_P,
        random_state=random_state,
        dist_lag=dist_lag
    )
    return result


##############################
# 3) Buchner Projection Route
##############################
class HistoricalCashflow(BaseModel):
    date: str  # "YYYY-MM-DD" or ISO date
    call: float
    dist: float

class BuchnerRequest(BaseModel):
    historical_data: List[HistoricalCashflow] = []
    # Buchner parameters
    kappa: float = 2.0
    theta: float = 0.5
    sigma_delta: float = 0.3
    alpha: float = 0.03
    m: float = 1.6
    sigma_P: float = 0.2
    projection_years: float = 5.0
    dt: float = 0.25
    random_state: int = 42
    committed_cap: float = 100.0


@router.post("/buchner_projection")
def run_buchner_model_endpoint(req: BuchnerRequest):
    """
    Takes in partial historical data and Buchner model parameters,
    returns combined historical+projected calls & dists.

    Example:
        POST /performance/buchner_projection
        {
          "historical_data": [
            {"date": "2020-01-01", "call": 10, "dist": 0},
            {"date": "2020-04-01", "call": 20, "dist": 0}
          ],
          "kappa": 2.0,
          "theta": 0.5,
          "sigma_delta": 0.3,
          "alpha": 0.03,
          "m": 1.6,
          "sigma_P": 0.2,
          "projection_years": 5.0,
          "dt": 0.25,
          "random_state": 42,
          "committed_cap": 100.0
        }
    """
    from utils.buchner import run_buchner_model

    hist_data = [dict(date=d.date, call=d.call, dist=d.dist) for d in req.historical_data]

    result = run_buchner_model(
        historical_data=hist_data,
        kappa=req.kappa,
        theta=req.theta,
        sigma_delta=req.sigma_delta,
        alpha=req.alpha,
        m=req.m,
        sigma_P=req.sigma_P,
        projection_years=req.projection_years,
        dt=req.dt,
        random_state=req.random_state,
        committed_cap=req.committed_cap
    )
    return result
