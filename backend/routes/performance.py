from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import numpy as np

router = APIRouter(tags=["Performance"])

@router.get("/timeseries")
def get_timeseries(steps: int = 100, starting_value: int = 0, num_processes: int = Query(1, ge=1, le=10)):
    """
    Return fake time series data as a list of time series, each with timestamp-value pairs.
    """
    now = datetime.utcnow()
    series_labels = [f"Process {i}" for i in range(1, num_processes + 1)]
    data = []
    for label in series_labels:
        series_data = []
        # Generate 10 data points using Geometric Brownian Motion
        N = steps
        dt = 1
        S0 = 1  # fixed initial value for simulation
        mu = 0.05
        sigma = 0.2
        rand = np.random.normal(0, 1, size=N)
        prices = [S0]
        for i in range(1, N):
            new_price = prices[-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * rand[i])
            prices.append(new_price)
        # Shift prices by the desired starting_value so that the trajectory starts at starting_value + 1
        prices = [starting_value + p for p in prices]
        for i in range(N):
            timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
            series_data.append({"timestamp": timestamp, "value": round(prices[i], 2)})
        data.append({"name": label, "data": series_data})
    return {"data": data}
