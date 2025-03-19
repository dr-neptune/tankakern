from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  # <-- Added
from datetime import datetime, timedelta
import random

from routes.data_extraction import router as data_extraction_router
from routes.performance import router as performance_router
from routes.extractive_qa import router as extractive_qa_router
from routes.extract_tables import router as extract_tables_router
from routes.auth import router as auth_router
from routes.user_management import router as user_management_router
from routes.track_record import router as track_record_router
from routes.relationships import router as relationships_router

app = FastAPI()

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers under their respective prefixes
app.include_router(data_extraction_router, prefix="/data-extraction")
app.include_router(performance_router, prefix="/performance")
app.include_router(extractive_qa_router, prefix="/data-extraction/process")
app.include_router(extract_tables_router, prefix="/data-extraction/tables")
app.include_router(auth_router, prefix="/auth")
app.include_router(user_management_router, prefix="/user-management")
app.include_router(relationships_router)

# >>> NEW ROUTER
app.include_router(track_record_router, prefix="/track-record")
# <<< NEW ROUTER

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
