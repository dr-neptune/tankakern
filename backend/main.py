from fastapi import FastAPI
from datetime import datetime, timedelta
import random

app = FastAPI()

@app.get("/timeseries")
def get_timeseries():
    """
    Return fake time series data as a list of timestamp-value pairs.
    """
    now = datetime.utcnow()
    data = []
    # Generate 10 data points spaced 5 minutes apart
    for i in range(10):
        timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
        value = round(random.uniform(0, 100), 2)
        data.append({"timestamp": timestamp, "value": value})
    return {"data": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
