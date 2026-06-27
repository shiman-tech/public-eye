import json
import re

import httpx

from app.config import settings
from app.schemas import Category, ClassifyImageResponse

CATEGORIES: list[Category] = [
    "Pothole",
    "Sanitation",
    "Streetlight",
    "Flooding",
    "Vandalism",
    "Other",
]

SYSTEM_PROMPT = f"""You are a civic infrastructure issue classifier. Analyze the image and classify it into exactly one category: {', '.join(CATEGORIES)}.

Respond with ONLY valid JSON in this format:
{{"category":"<category>","confidence":<0-100>}}

Rules:
- category must be one of the listed values exactly
- confidence is your certainty percentage (integer 0-100)
- If unclear, use "Other" with lower confidence"""


async def classify_image(image_base64: str, mime_type: str = "image/jpeg") -> ClassifyImageResponse:
    if not settings.openai_api_key:
        raise ValueError("OpenAI API key not configured")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "max_tokens": 100,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Classify this civic infrastructure issue."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_base64}",
                                    "detail": "low",
                                },
                            },
                        ],
                    },
                ],
            },
        )

    if response.status_code != 200:
        raise RuntimeError(f"OpenAI request failed: {response.text}")

    data = response.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()

    try:
        match = re.search(r"\{[\s\S]*\}", content)
        parsed = json.loads(match.group(0) if match else content)
    except (json.JSONDecodeError, AttributeError):
        parsed = {"category": "Other", "confidence": 50}

    category = parsed.get("category") if parsed.get("category") in CATEGORIES else "Other"
    confidence = min(100, max(0, round(float(parsed.get("confidence") or 50))))

    return ClassifyImageResponse(category=category, confidence=confidence, isAI=True, model="gpt-4o-mini")
