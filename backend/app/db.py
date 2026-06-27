from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_client(token: str | None = None) -> Client:
    if token:
        client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        client.postgrest.auth(token)
        return client
    return get_supabase()
