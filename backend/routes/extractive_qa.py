from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from haystack import Document, Pipeline
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever
from haystack.components.readers import ExtractiveReader
from haystack.components.embedders import SentenceTransformersDocumentEmbedder, SentenceTransformersTextEmbedder
from haystack.components.writers import DocumentWriter
from utils.pdf_processing import process_pdf_to_markdown

router = APIRouter(tags=["Extractive QA"])

@router.post("/process")
async def process_extractive_qa(
    pdf_file: UploadFile = File(...),
    query: str = Form(...)
):
    """
    Accepts a PDF file upload and a form field 'query'.
    Processes the PDF using docling, builds a minimal Haystack extractive QA pipeline,
    indexes the resulting markdown as a single document, and returns the QA results.
    """
    markdown = await process_pdf_to_markdown(pdf_file)
    
    # Create a document store and index the provided markdown as one document.
    document_store = InMemoryDocumentStore()
    document = Document(content=markdown, meta={"source": "docling", "split_id": 0})
    model = "sentence-transformers/multi-qa-mpnet-base-dot-v1"
    embedder = SentenceTransformersDocumentEmbedder(model=model)
    writer = DocumentWriter(document_store=document_store)

    indexing_pipeline = Pipeline()
    indexing_pipeline.add_component(instance=embedder, name="embedder")
    indexing_pipeline.add_component(instance=writer, name="writer")
    indexing_pipeline.connect("embedder.documents", "writer.documents")
    indexing_pipeline.run({"documents": [document]})

    # Build the extractive QA pipeline.
    retriever = InMemoryEmbeddingRetriever(document_store=document_store)
    reader = ExtractiveReader(no_answer=True)
    reader.warm_up()
    
    qa_pipeline = Pipeline()
    qa_pipeline.add_component(instance=SentenceTransformersTextEmbedder(model=model), name="text_embedder")
    qa_pipeline.add_component(instance=retriever, name="retriever")
    qa_pipeline.add_component(instance=reader, name="reader")
    qa_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
    qa_pipeline.connect("retriever.documents", "reader.documents")

    result = qa_pipeline.run(
        data={
            "text_embedder": {"text": query},
            "retriever": {"top_k": 3},
            "reader": {"query": query, "top_k": 2}
        }
    )
    # Post-process results: retrieve contextual window for each answer and remove unnecessary document details.
    from haystack.components.retrievers import SentenceWindowRetriever
    window_retriever = SentenceWindowRetriever(document_store=document_store, window_size=2)
    if "reader" in result and "answers" in result["reader"]:
        for answer in result["reader"]["answers"]:
            if getattr(answer, "document", None):
                # Retrieve context window around the matching sentence.
                context_result = window_retriever.run(retrieved_documents=[answer.document])
                if "context_windows" in context_result and context_result["context_windows"]:
                    answer.context = context_result["context_windows"][0]
                else:
                    answer.context = ""
                # Clean document details.
                if not isinstance(answer.document, dict):
                    doc = answer.document.__dict__
                    for key in ["content", "embedding", "sparse_embedding", "dataframe", "blob"]:
                        doc.pop(key, None)
                    answer.document = doc
                else:
                    for key in ["content", "embedding", "sparse_embedding", "dataframe", "blob"]:
                        answer.document.pop(key, None)
    return result
