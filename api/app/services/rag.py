import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
import io

from app.config import get_settings

_chroma_client: chromadb.ClientAPI | None = None
_text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=50,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def _get_chroma() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        settings = get_settings()
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma_client


def _collection_name(bot_id: str) -> str:
    return f"bot_{bot_id.replace('-', '_')}"


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> str:
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    return file_bytes.decode("utf-8", errors="replace")


def chunk_text(text: str) -> list[str]:
    return _text_splitter.split_text(text)


def add_chunks(bot_id: str, doc_id: str, chunks: list[str]):
    """Embed and store document chunks in ChromaDB."""
    if not chunks:
        return
    client = _get_chroma()
    collection = client.get_or_create_collection(
        name=_collection_name(bot_id),
        metadata={"hnsw:space": "cosine"},
    )
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids, metadatas=metadatas)


def remove_document_chunks(bot_id: str, doc_id: str):
    client = _get_chroma()
    try:
        collection = client.get_collection(name=_collection_name(bot_id))
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass


def retrieve_context(bot_id: str, query: str, n_results: int = 5) -> list[str]:
    client = _get_chroma()
    try:
        collection = client.get_collection(name=_collection_name(bot_id))
    except Exception:
        return []
    results = collection.query(query_texts=[query], n_results=n_results)
    return results["documents"][0] if results["documents"] else []


def delete_collection(bot_id: str):
    client = _get_chroma()
    try:
        client.delete_collection(name=_collection_name(bot_id))
    except Exception:
        pass
