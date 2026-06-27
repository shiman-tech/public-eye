from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.auth import get_current_admin
from app.db import get_supabase, get_supabase_client
from app.schemas import ReportResponse, StatusHistoryEntry, StatusUpdateRequest
from app.services.storage import upload_report_image

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportResponse])
async def list_reports() -> list[dict]:
    supabase = get_supabase()
    response = supabase.table("reports").select("*").order("created_at", desc=True).execute()
    if response.data is None:
        return []
    return response.data


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    category: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    title: str | None = Form(None),
    description: str | None = Form(None),
    priority: str = Form("Medium"),
    address: str | None = Form(None),
    reported_by: str = Form("Anonymous"),
    image: UploadFile | None = File(None),
) -> dict:
    image_url = None
    if image and image.filename:
        image_url = upload_report_image(image.file, image.filename, image.content_type or "image/jpeg")

    payload = {
        "title": title or f"{category} Issue",
        "description": description,
        "category": category,
        "priority": priority,
        "lat": lat,
        "lng": lng,
        "address": address,
        "image_url": image_url,
        "reported_by": reported_by,
        "status": "Open",
    }

    supabase = get_supabase()
    response = supabase.table("reports").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create report")
    return response.data[0]


@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: UUID,
    body: StatusUpdateRequest,
    admin: dict = Depends(get_current_admin),
) -> dict:
    admin_email = admin["email"]
    token = admin["token"]
    payload: dict = {"status": body.status}

    if body.status == "Resolved":
        payload["resolved_by"] = admin_email
        payload["resolved_at"] = datetime.now(timezone.utc).isoformat()
    elif body.previous_status == "Resolved" and body.status != "Resolved":
        payload["resolved_by"] = None
        payload["resolved_at"] = None

    if body.admin_note:
        payload["admin_notes"] = body.admin_note

    supabase = get_supabase_client(token)
    response = (
        supabase.table("reports")
        .update(payload)
        .eq("id", str(report_id))
        .select("*")
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        supabase.table("status_history").insert(
            {
                "report_id": str(report_id),
                "from_status": body.previous_status or None,
                "to_status": body.status,
                "changed_by": admin_email,
                "note": body.admin_note or None,
            }
        ).execute()
    except Exception:
        pass

    return response.data[0]


@router.get("/{report_id}/history", response_model=list[StatusHistoryEntry])
async def get_status_history(report_id: UUID) -> list[dict]:
    supabase = get_supabase()
    response = (
        supabase.table("status_history")
        .select("*")
        .eq("report_id", str(report_id))
        .order("changed_at")
        .execute()
    )
    return response.data or []
