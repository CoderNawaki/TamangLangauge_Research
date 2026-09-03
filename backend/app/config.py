from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="TAMANG_", extra="ignore")

    database_url: str = "sqlite:///./tamang_dict.db"
    debug: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
