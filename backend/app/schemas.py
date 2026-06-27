from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["Pothole", "Sanitation", "Streetlight", "Flooding", "Vandalism", "Other"]
Status = Literal["Open", "In Progress", "Resolved"]
Priority = Literal["Low", "Medium", "High", "Critical"]


class ReportBase(BaseModel):
    title: str
    description: str | None = None
    category: Category
    priority: Priority = "Medium"
    address: str | None = None
    lat: float
    lng: float
    image_url: str | None = None
    reported_by: str = "Anonymous"
    status: Status = "Open"


class ReportCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: Category
    priority: Priority = "Medium"
    lat: float
    lng: float
    address: str | None = None
    reported_by: str = "Anonymous"


class ReportResponse(ReportBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    admin_notes: str | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None


class StatusUpdateRequest(BaseModel):
    status: Status
    admin_note: str = ""
    previous_status: str = ""


class StatusHistoryEntry(BaseModel):
    id: UUID
    report_id: UUID
    from_status: str | None
    to_status: str
    changed_by: str
    note: str | None
    changed_at: datetime


class ClassifyImageRequest(BaseModel):
    image_base64: str = Field(alias="imageBase64")
    mime_type: str = Field(default="image/jpeg", alias="mimeType")

    model_config = {"populate_by_name": True}


class ClassifyImageResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category: Category
    confidence: int
    is_ai: bool = Field(default=True, alias="isAI", serialization_alias="isAI")
    model: str | None = None
    source: str | None = None


class ReverseGeocodeResponse(BaseModel):
    address: str
