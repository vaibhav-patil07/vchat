from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.bot import Bot
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.rag import extract_text, chunk_text, add_chunks, remove_document_chunks
from app.auth import require_auth

router = APIRouter(tags=["documents"], dependencies=[Depends(require_auth)])

ALLOWED_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/octet-stream",
}
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}


@router.post("/bots/{bot_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    bot_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")

    filename = file.filename or "unknown"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")

    file_bytes = await file.read()
    raw_text = extract_text(file_bytes, file.content_type or "", filename)

    chunks = chunk_text(raw_text)

    doc = Document(
        bot_id=bot_id,
        filename=filename,
        content_type=file.content_type or "text/plain",
        raw_text=raw_text,
        chunk_count=len(chunks),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    add_chunks(bot_id, doc.id, chunks)

    return DocumentResponse.model_validate(doc)


@router.get("/bots/{bot_id}/documents", response_model=list[DocumentResponse])
async def list_documents(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    result = await db.execute(
        select(Document).where(Document.bot_id == bot_id).order_by(Document.created_at.desc())
    )
    return [DocumentResponse.model_validate(d) for d in result.scalars().all()]


@router.delete("/bots/{bot_id}/documents/{doc_id}", status_code=204)
async def delete_document(bot_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc or doc.bot_id != bot_id:
        raise HTTPException(404, "Document not found")
    remove_document_chunks(bot_id, doc_id)
    await db.delete(doc)
    await db.commit()
