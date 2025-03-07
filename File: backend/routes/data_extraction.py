from fastapi import APIRouter, File, UploadFile, HTTPException
import tempfile
import os

from docling.document_converter import DocumentConverter

router = APIRouter(tags=["Data Extraction"])

@router.post("/process_pdf")
async def process_pdf(pdf_file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, processes it using docling, and returns the
    extracted document as Markdown.
    """
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF file.")

    # Save the uploaded PDF to a temporary file.
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            content = await pdf_file.read()
            tmp.write(content)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded PDF: {str(e)}")

    try:
        # Use docling to convert the PDF.
        converter = DocumentConverter()
        result = converter.convert(tmp_path)
        markdown = result.document.export_to_markdown()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        os.remove(tmp_path)

    return {"markdown": markdown}
from fastapi import APIRouter, File, UploadFile, HTTPException
import tempfile
import os

from docling.document_converter import DocumentConverter

router = APIRouter(tags=["Data Extraction"])

@router.post("/process_pdf")
async def process_pdf(pdf_file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, processes it using docling, and returns the
    extracted document as Markdown.
    """
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF file.")

    # Save the uploaded PDF to a temporary file.
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            content = await pdf_file.read()
            tmp.write(content)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded PDF: {str(e)}")

    try:
        # Use docling to convert the PDF.
        converter = DocumentConverter()
        result = converter.convert(tmp_path)
        markdown = result.document.export_to_markdown()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        os.remove(tmp_path)

    return {"markdown": markdown}
