"""SportShield AI — Shield AI Chat endpoint powered by Google Gemini."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models.violation import Violation
from app.models.asset import MediaAsset as Asset

router = APIRouter(prefix="/ai", tags=["shield-ai"])

# ─── Request / Response schemas ───

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    source: str  # "gemini" or "fallback"


# ─── System prompt with live data context ───

SYSTEM_PROMPT = """You are Shield AI, the intelligent IP protection assistant for SportShield — an AI-powered platform that protects sports organizations' intellectual property (logos, match footage, player images, merchandise) from unauthorized use across the internet.

Your capabilities:
1. Analyze violation data and identify patterns
2. Recommend takedown strategies (DMCA notices)
3. Assess asset vulnerability and threat levels
4. Provide revenue impact analysis
5. Suggest scan frequency optimizations

Personality:
- Professional, precise, and data-driven
- Use emojis sparingly (📊, 🎯, 🛡️, ⚡) to highlight sections
- Format responses with **bold headers** and bullet points
- When suggesting actions, include [ACTION:TAKEDOWN_YOUTUBE], [ACTION:UPGRADE_SCAN], or [ACTION:EXECUTE_BATCH] tags that the UI renders as interactive buttons
- Always reference specific numbers from the data context provided
- Be concise but thorough

IMPORTANT: You have access to REAL platform data provided in the context below. Always reference this data in your answers.
"""


async def _build_data_context(db: AsyncSession, org_id: str) -> str:
    """Pull live stats from the database to give Gemini real context."""
    try:
        # Total assets
        asset_count = await db.execute(
            select(func.count(Asset.id)).where(Asset.org_id == org_id)
        )
        total_assets = asset_count.scalar() or 0

        # Total violations
        violation_count = await db.execute(
            select(func.count(Violation.id)).where(Violation.org_id == org_id)
        )
        total_violations = violation_count.scalar() or 0

        # Violations by severity
        severity_counts = {}
        for sev in ["critical", "high", "medium", "low"]:
            result = await db.execute(
                select(func.count(Violation.id)).where(
                    Violation.org_id == org_id,
                    Violation.severity == sev
                )
            )
            severity_counts[sev] = result.scalar() or 0

        # Violations by platform
        platform_results = await db.execute(
            select(Violation.platform, func.count(Violation.id))
            .where(Violation.org_id == org_id)
            .group_by(Violation.platform)
        )
        platform_counts = {row[0]: row[1] for row in platform_results.all()}

        # Violations by status
        status_results = await db.execute(
            select(Violation.status, func.count(Violation.id))
            .where(Violation.org_id == org_id)
            .group_by(Violation.status)
        )
        status_counts = {row[0]: row[1] for row in status_results.all()}

        # Top 5 most violated assets
        top_assets_result = await db.execute(
            select(Asset.name, func.count(Violation.id).label("vcount"))
            .join(Violation, Violation.asset_id == Asset.id)
            .where(Asset.org_id == org_id)
            .group_by(Asset.name)
            .order_by(func.count(Violation.id).desc())
            .limit(5)
        )
        top_assets = [{"name": row[0], "violations": row[1]} for row in top_assets_result.all()]

        context = f"""
--- LIVE PLATFORM DATA ---
Total Protected Assets: {total_assets}
Total Violations Detected: {total_violations}

Violations by Severity:
- Critical: {severity_counts.get('critical', 0)}
- High: {severity_counts.get('high', 0)}
- Medium: {severity_counts.get('medium', 0)}
- Low: {severity_counts.get('low', 0)}

Violations by Platform:
{chr(10).join(f'- {platform}: {count}' for platform, count in platform_counts.items()) if platform_counts else '- No violations yet'}

Violations by Status:
{chr(10).join(f'- {status}: {count}' for status, count in status_counts.items()) if status_counts else '- No violations yet'}

Top Targeted Assets:
{chr(10).join(f'- {a["name"]}: {a["violations"]} violations' for a in top_assets) if top_assets else '- No assets targeted yet'}
--- END DATA ---
"""
        return context
    except Exception as e:
        return f"\n--- DATA UNAVAILABLE: {str(e)} ---\n"


async def _call_gemini(message: str, history: List[ChatMessage], data_context: str) -> str:
    """Call Google Gemini API with conversation history and platform data."""
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction=SYSTEM_PROMPT + data_context,
    )

    # Build and sanitize conversation history for Gemini (must alternate user/model)
    gemini_history = []
    last_role = None
    for msg in (history or []):
        role = "user" if msg.role == "user" else "model"
        if role == last_role:
            # If consecutive same-role messages, append to the previous instead of skipping
            gemini_history[-1]["parts"][0] += f"\n\n{msg.content}"
        else:
            gemini_history.append({"role": role, "parts": [msg.content]})
            last_role = role

    chat = model.start_chat(history=gemini_history)
    response = await chat.send_message_async(message)

    return response.text


def _fallback_response(message: str) -> str:
    """Basic fallback when Gemini API is unavailable."""
    q = message.lower()

    if "violation" in q or "how many" in q:
        return "📊 I'd love to analyze your violations, but the AI engine is currently in fallback mode. Please check back shortly or view the Violations page directly."

    if "takedown" in q or "strategy" in q:
        return "⚡ For takedown strategies, head to the Violations page and use the one-click DMCA feature. The AI analysis engine will be back online shortly."

    if "asset" in q or "targeted" in q:
        return "🎯 Check the Asset Library for vulnerability scores. The AI engine is temporarily in fallback mode."

    return """🛡️ I'm Shield AI, your IP protection assistant. I'm currently running in fallback mode.

I can help with:
1. Violation analysis and trends
2. Takedown strategy recommendations
3. Asset vulnerability assessments
4. Revenue impact calculations

The full Gemini-powered engine will reconnect shortly. In the meantime, try asking a specific question!"""


@router.post("/chat", response_model=ChatResponse)
async def shield_ai_chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Chat with Shield AI — powered by Google Gemini with live platform data."""
    # Get the user's org_id from the token (stored in JWT)
    from app.models.user import User
    import uuid

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    org_id = str(user.org_id)

    # Build live data context from database
    data_context = await _build_data_context(db, org_id)

    # Try Gemini first, fallback if unavailable
    if settings.GEMINI_API_KEY:
        try:
            response_text = await _call_gemini(
                request.message, request.history or [], data_context
            )
            return ChatResponse(response=response_text, source="gemini")
        except Exception as e:
            print(f"Gemini API error: {e}")
            error_msg = str(e)
            return ChatResponse(
                response=f"⚠️ Gemini API Error: {error_msg}\n\nPlease check Render logs or API key.",
                source="fallback"
            )

    response_text = _fallback_response(request.message)
    return ChatResponse(response=f"Fallback active. API Key present: {bool(settings.GEMINI_API_KEY)}. Original: " + response_text, source="fallback")
