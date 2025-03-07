from fastapi import APIRouter, HTTPException
from haystack import Document, Pipeline
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever
from haystack.components.readers import ExtractiveReader
from haystack.components.embedders import SentenceTransformersDocumentEmbedder, SentenceTransformersTextEmbedder
from haystack.components.writers import DocumentWriter

router = APIRouter(tags=["Extractive QA"])

@router.post("/process")
async def process_extractive_qa(payload: dict):
    """
    Accepts a JSON payload with two keys: 'markdown' (the output from docling)
    and 'query' (the question to ask). It builds a minimal Haystack extractive QA pipeline,
    indexes the provided markdown as a single document, and returns the QA results.
    """
    markdown = payload.get("markdown")
    query = payload.get("query")
    if not markdown or not query:
        raise HTTPException(status_code=400, detail="Both 'markdown' and 'query' must be provided.")

    # Create a document store and index the provided markdown as one document.
    document_store = InMemoryDocumentStore()
    document = Document(content=markdown, meta={"source": "docling"})
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
    return result
