from fastapi import FastAPI
from backend.routes.data_extraction import router as data_extraction_router

app = FastAPI(
    title="Zappa Backend API",
    description="API for Zappa Extractive QA Service",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Zappa API"}

app.include_router(data_extraction_router)
