import uuid
from typing import BinaryIO

from app.db import get_supabase

BUCKET = "report-images"


def upload_report_image(file: BinaryIO, filename: str, content_type: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    object_name = f"report_{uuid.uuid4().hex}.{ext}"

    supabase = get_supabase()
    file_bytes = file.read()

    supabase.storage.from_(BUCKET).upload(
        object_name,
        file_bytes,
        file_options={"content-type": content_type, "cache-control": "3600", "upsert": "false"},
    )

    public_url = supabase.storage.from_(BUCKET).get_public_url(object_name)
    return public_url
