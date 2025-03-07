from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["Performance"])

@router.get("/timeseries")
def get_timeseries():
    """
    Return fake time series data as a list of time series, each with timestamp-value pairs.
    """
    now = datetime.utcnow()
    series_labels = ["Series A", "Series B", "Series C"]
    data = []
    for label in series_labels:
        series_data = []
        # Generate 10 data points spaced 5 minutes apart
        for i in range(10):
            timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
            value = round(random.uniform(0, 100), 2)
            series_data.append({"timestamp": timestamp, "value": value})
        data.append({"name": label, "data": series_data})
    return {"data": data}
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["Performance"])

@router.get("/timeseries")
def get_timeseries():
    """
    Return fake time series data as a list of time series, each with timestamp-value pairs.
    """
    now = datetime.utcnow()
    series_labels = ["Series A", "Series B", "Series C"]
    data = []
    for label in series_labels:
        series_data = []
        # Generate 10 data points spaced 5 minutes apart
        for i in range(10):
            timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
            value = round(random.uniform(0, 100), 2)
            series_data.append({"timestamp": timestamp, "value": value})
        data.append({"name": label, "data": series_data})
    return {"data": data}
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["Performance"])

@router.get("/timeseries")
def get_timeseries():
    """
    Return fake time series data as a list of time series, each with timestamp-value pairs.
    """
    now = datetime.utcnow()
    series_labels = ["Series A", "Series B", "Series C"]
    data = []
    for label in series_labels:
        series_data = []
        # Generate 10 data points spaced 5 minutes apart
        for i in range(10):
            timestamp = (now - timedelta(minutes=5 * i)).isoformat() + "Z"
            value = round(random.uniform(0, 100), 2)
            series_data.append({"timestamp": timestamp, "value": value})
        data.append({"name": label, "data": series_data})
    return {"data": data}
