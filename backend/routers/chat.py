"""Agentic RAG chat endpoint."""

from fastapi import APIRouter, Depends, Request

from models.schemas import ChatRequest, ChatResponse
from security import limiter, verify_api_key
from services import rag_agent

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/ask", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("30/minute")
async def ask(request: Request, payload: ChatRequest) -> ChatResponse:
    result = rag_agent.answer_question(payload.question, payload.conversation_history)
    return ChatResponse(**result)
