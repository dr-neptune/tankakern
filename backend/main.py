from fastapi import FastAPI
from datetime import datetime, timedelta
import random
from routes.data_extraction import router as data_extraction_router
from routes.performance import router as performance_router

app = FastAPI()
app.include_router(data_extraction_router, prefix="/data-extraction")
app.include_router(performance_router, prefix="/performance")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
