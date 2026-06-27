import httpx
from fastapi import APIRouter, HTTPException, Query

from app.schemas import ReverseGeocodeResponse

router = APIRouter(prefix="/geocode", tags=["geocode"])

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {"Accept-Language": "en", "User-Agent": "CivicPulse-FARM/1.0"}


@router.get("/reverse", response_model=ReverseGeocodeResponse)
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
) -> ReverseGeocodeResponse:
    url = f"{NOMINATIM_BASE}/reverse?format=json&lat={lat}&lon={lng}&addressdetails=1&zoom=18"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=HEADERS)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")

    data = response.json()
    addr = data.get("address") or {}
    parts = [
        addr.get("house_number"),
        addr.get("road") or addr.get("pedestrian") or addr.get("footway"),
        addr.get("suburb") or addr.get("neighbourhood"),
        addr.get("city") or addr.get("town") or addr.get("village"),
        addr.get("state"),
    ]
    parts = [part for part in parts if part]

    if parts:
        address = ", ".join(parts)
    else:
        address = data.get("display_name") or f"{lat:.5f}, {lng:.5f}"

    return ReverseGeocodeResponse(address=address)
