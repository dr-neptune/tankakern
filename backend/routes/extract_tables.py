from fastapi import APIRouter, UploadFile, HTTPException
import tempfile
import os
from docling.document_converter import DocumentConverter

router = APIRouter()

@router.post("/extract-tables")
async def extract_tables(pdf_file: UploadFile):
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF file.")
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            content = await pdf_file.read()
            tmp.write(content)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded PDF: {str(e)}")
    try:
        converter = DocumentConverter()
        conv_res = converter.convert(tmp_path)
        tables = []
        for idx, table in enumerate(conv_res.document.tables):
            df = table.export_to_dataframe()
            markdown = df.to_markdown()
            tables.append({"table_index": idx, "markdown": markdown})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        os.remove(tmp_path)
    return {"tables": tables}
