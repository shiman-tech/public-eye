from fastapi import APIRouter, HTTPException, status

from app.schemas import ClassifyImageRequest, ClassifyImageResponse
from app.services.ai_classifier import classify_image

router = APIRouter(tags=["classify"])


@router.post("/classify-image", response_model=ClassifyImageResponse, response_model_by_alias=True)
async def classify_image_endpoint(body: ClassifyImageRequest) -> ClassifyImageResponse:
    if not body.image_base64:
        raise HTTPException(status_code=400, detail="imageBase64 is required")

    try:
        return await classify_image(body.image_base64, body.mime_type)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
