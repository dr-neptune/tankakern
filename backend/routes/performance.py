from fastapi import APIRouter
from datetime import datetime, timedelta
import numpy as np

router = APIRouter(tags=["Performance"])

@router.get("/timeseries")
def get_timeseries(steps: int = 100):
    """
    Return fake time series data as a list of time series, each with timestamp-value pairs.
    """
    now = datetime.utcnow()
    series_labels = ["Series A", "Series B", "Series C"]
    data = []
    for label in series_labels:
        series_data = []
        # Generate 10 data points using Geometric Brownian Motion
        N = steps
        dt = 1
        S0 = 100
        mu = 0.05
        sigma = 0.2
        rand = np.random.normal(0, 1, size=N)
        prices = [S0]
        for i in range(1, N):
            new_price = prices[-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * rand[i])
            prices.append(new_price)
        for i in range(N):
            timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
            series_data.append({"timestamp": timestamp, "value": round(prices[i], 2)})
        data.append({"name": label, "data": series_data})
    return {"data": data}
