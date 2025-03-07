from fastapi import APIRouter, File, UploadFile, HTTPException
from utils.pdf_processing import process_pdf_to_markdown

router = APIRouter(tags=["Data Extraction"])

@router.post("/process_pdf")
async def process_pdf(pdf_file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, processes it using docling, and returns the
    extracted document as Markdown.
    """
    markdown = await process_pdf_to_markdown(pdf_file)
    return {"markdown": markdown}
